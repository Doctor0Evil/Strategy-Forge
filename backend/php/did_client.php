<?php
declare(strict_types=1);

/**
 * DID client for StrategyForge (PHP).
 *
 * Note:
 * - Uses public information in backend/config/did.json.
 * - Verifies compact JWS/JWT using ES256 and the DID public key.
 * - For simplicity, this uses openssl_verify and expects the JWT to be
 *   signed with a P-256 key matching the DID document.
 *
 * This is not a complete OpenID Connect implementation; it is a minimal
 * verification layer for DID-based bearer tokens.
 */

function load_did_document(): ?array
{
    $baseDir = getenv('STRATEGYFORGE_BASE_DIR') ?: __DIR__ . '/..';
    $path = rtrim($baseDir, '/') . '/config/did.json';
    if (!is_file($path)) {
        return null;
    }
    $json = file_get_contents($path);
    if ($json === false) {
        return null;
    }
    $doc = json_decode($json, true);
    return is_array($doc) ? $doc : null;
}

function jwk_to_pem(array $jwk): ?string
{
    if (($jwk['kty'] ?? '') !== 'EC' || ($jwk['crv'] ?? '') !== 'P-256') {
        return null;
    }
    $x = base64_decode(strtr($jwk['x'], '-_', '+/'), true);
    $y = base64_decode(strtr($jwk['y'], '-_', '+/'), true);
    if ($x === false || $y === false) {
        return null;
    }
    $pubKey = "\x04" . $x . $y;

    $ecPoint = "\x03" . chr(strlen($pubKey)) . $pubKey;
    $oidEcPublicKey = "\x06\x07\x2A\x86\x48\xCE\x3D\x02\x01";
    $oidPrime256v1  = "\x06\x08\x2A\x86\x48\xCE\x3D\x03\x01\x07";

    $algId = "\x30" . chr(strlen($oidEcPublicKey . $oidPrime256v1)) . $oidEcPublicKey . $oidPrime256v1;
    $subjectPublicKey = "\x03" . chr(strlen($ecPoint)) . $ecPoint;

    $seq = "\x30" . chr(strlen($algId . $subjectPublicKey)) . $algId . $subjectPublicKey;
    $pem = "-----BEGIN PUBLIC KEY-----\n" .
        chunk_split(base64_encode($seq), 64, "\n") .
        "-----END PUBLIC KEY-----\n";

    return $pem;
}

function parse_jwt(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    list($h, $p, $s) = $parts;
    $headerJson = base64_decode(strtr($h, '-_', '+/'), true);
    $payloadJson = base64_decode(strtr($p, '-_', '+/'), true);
    if ($headerJson === false || $payloadJson === false) {
        return null;
    }
    $header = json_decode($headerJson, true);
    $payload = json_decode($payloadJson, true);
    if (!is_array($header) || !is_array($payload)) {
        return null;
    }
    return [
        'header'  => $header,
        'payload' => $payload,
        'sig'     => $s,
        'signed'  => $h . '.' . $p
    ];
}

function validate_did_token(string $token): bool
{
    $doc = load_did_document();
    if ($doc === null) {
        return false;
    }

    $jwt = parse_jwt($token);
    if ($jwt === null) {
        return false;
    }
    $header = $jwt['header'];
    $payload = $jwt['payload'];
    if (($header['alg'] ?? '') !== 'ES256') {
        return false;
    }

    $vmId = $doc['authentication'][0] ?? null;
    if ($vmId === null) {
        return false;
    }
    $vm = null;
    foreach ($doc['verificationMethod'] as $candidate) {
        if (($candidate['id'] ?? '') === $vmId) {
            $vm = $candidate;
            break;
        }
    }
    if ($vm === null) {
        return false;
    }

    $pem = jwk_to_pem($vm['publicKeyJwk']);
    if ($pem === null) {
        return false;
    }

    $sigBin = base64_decode(strtr($jwt['sig'], '-_', '+/'), true);
    if ($sigBin === false) {
        return false;
    }

    $ok = openssl_verify(
        $jwt['signed'],
        $sigBin,
        $pem,
        OPENSSL_ALGO_SHA256
    );
    if ($ok !== 1) {
        return false;
    }

    $now = time();
    if (isset($payload['exp']) && $now > (int)$payload['exp']) {
        return false;
    }
    if (isset($payload['nbf']) && $now < (int)$payload['nbf']) {
        return false;
    }

    $expectedDid = getenv('DID_URI') ?: ($doc['id'] ?? null);
    if ($expectedDid !== null) {
        if (($payload['sub'] ?? '') !== $expectedDid) {
            return false;
        }
    }

    return true;
}
