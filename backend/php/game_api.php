<?php
declare(strict_types=1);

/**
 * StrategyForge game_api.php
 *
 * Actions:
 *   - load
 *   - deploy
 *   - join_faction
 *   - trade
 *   - auction
 *   - embed
 *
 * Storage:
 *   - Redis: ephemeral session / rate limiting
 *   - PostgreSQL: primary game_state, errors, rag_context
 *   - SQLite: local fallback for game_state + errors
 *   - ZeroMQ: PUB broadcast to Node socket gateway
 *
 * Security:
 *   - CORS origin from GAME_CORS_ORIGIN
 *   - Optional DID-based auth via DID_AUTH_ENABLED + did_client.php
 */

ini_set('display_errors', '0');
error_reporting(E_ALL);

$baseDir = getenv('STRATEGYFORGE_BASE_DIR') ?: __DIR__ . '/..';

require_once $baseDir . '/php/did_client.php';

header('Content-Type: application/json; charset=utf-8');

// CORS
$corsOrigin = getenv('GAME_CORS_ORIGIN') ?: '*';
header('Access-Control-Allow-Origin: ' . $corsOrigin);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function getPostJson(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(['error' => 'Invalid JSON'], 400);
    }
    return $data;
}

function validateAction(string $action): bool
{
    $allowed = ['load', 'deploy', 'join_faction', 'trade', 'auction', 'embed'];
    return in_array($action, $allowed, true);
}

function validateUserId(?string $userId): bool
{
    if ($userId === null) {
        return false;
    }
    $len = strlen($userId);
    if ($len < 3 || $len > 128) {
        return false;
    }
    return preg_match('/^[A-Za-z0-9_\-:@.]+$/', $userId) === 1;
}

function initRedis(): ?Redis
{
    $host = getenv('REDIS_HOST') ?: 'redis';
    $port = (int)(getenv('REDIS_PORT') ?: 6379);

    $redis = new Redis();
    try {
        $redis->connect($host, $port, 1.5);
        $password = getenv('REDIS_PASSWORD');
        if ($password) {
            $redis->auth($password);
        }
        return $redis;
    } catch (Throwable $e) {
        return null;
    }
}

function initPg(): ?PDO
{
    $host = getenv('POSTGRES_HOST') ?: 'postgres';
    $port = (int)(getenv('POSTGRES_PORT') ?: 5432);
    $db   = getenv('POSTGRES_DB') ?: 'strategyforge';
    $user = getenv('POSTGRES_USER') ?: 'strategyforge';
    $pass = getenv('POSTGRES_PASSWORD') ?: '';

    $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s', $host, $port, $db);

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        return $pdo;
    } catch (Throwable $e) {
        return null;
    }
}

function initSqlite(string $baseDir): ?PDO
{
    $path = rtrim($baseDir, '/') . '/sqlite/game_state.sqlite3';
    if (!is_dir(dirname($path))) {
        mkdir(dirname($path), 0770, true);
    }
    try {
        $pdo = new PDO('sqlite:' . $path);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (Throwable $e) {
        return null;
    }
}

function initZmq(): ?ZMQSocket
{
    if (!extension_loaded('zmq')) {
        return null;
    }
    $endpoint = getenv('ZMQ_ENDPOINT') ?: 'tcp://socket-gateway:5556';
    try {
        $ctx = new ZMQContext();
        $socket = new ZMQSocket($ctx, ZMQ::SOCKET_PUB);
        $socket->connect($endpoint);
        return $socket;
    } catch (Throwable $e) {
        return null;
    }
}

function recordError(?PDO $pg, ?PDO $sqlite, ?string $userId, string $message): void
{
    $msg = substr($message, 0, 4000);

    if ($pg instanceof PDO) {
        try {
            $stmt = $pg->prepare('INSERT INTO errors (user_id, message) VALUES (:user_id, :message)');
            $stmt->execute([
                ':user_id' => $userId,
                ':message' => $msg
            ]);
            return;
        } catch (Throwable $e) {
            // fall-through to SQLite
        }
    }

    if ($sqlite instanceof PDO) {
        try {
            $sqlite->exec(
                'CREATE TABLE IF NOT EXISTS errors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    message TEXT,
                    timestamp TEXT DEFAULT (datetime("now"))
                )'
            );
            $stmt = $sqlite->prepare('INSERT INTO errors (user_id, message) VALUES (:user_id, :message)');
            $stmt->execute([
                ':user_id' => $userId,
                ':message' => $msg
            ]);
        } catch (Throwable $e) {
            // last resort: ignore
        }
    }
}

function defaultGameState(string $userId): array
{
    return [
        'user_id'    => $userId,
        'resources'  => ['ore' => 0, 'energy' => 0, 'credits' => 0],
        'units'      => ['miners' => 0, 'drones' => 0, 'turrets' => 0],
        'faction'    => null,
        'leaderboard'=> [],
        'auctions'   => []
    ];
}

function loadState(PDO $pg = null, PDO $sqlite = null, string $userId): array
{
    if ($pg instanceof PDO) {
        $stmt = $pg->prepare('SELECT resources, units, faction, leaderboard, auctions FROM game_state WHERE user_id = :uid');
        $stmt->execute([':uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row !== false) {
            return [
                'user_id'    => $userId,
                'resources'  => json_decode($row['resources'], true) ?: ['ore' => 0, 'energy' => 0, 'credits' => 0],
                'units'      => json_decode($row['units'], true) ?: ['miners' => 0, 'drones' => 0, 'turrets' => 0],
                'faction'    => $row['faction'],
                'leaderboard'=> json_decode($row['leaderboard'], true) ?: [],
                'auctions'   => json_decode($row['auctions'], true) ?: []
            ];
        }
    } elseif ($sqlite instanceof PDO) {
        $sqlite->exec(
            'CREATE TABLE IF NOT EXISTS game_state (
                user_id TEXT PRIMARY KEY,
                resources TEXT,
                units TEXT,
                faction TEXT,
                leaderboard TEXT,
                auctions TEXT,
                created_at TEXT DEFAULT (datetime("now")),
                updated_at TEXT DEFAULT (datetime("now"))
            )'
        );
        $stmt = $sqlite->prepare('SELECT resources, units, faction, leaderboard, auctions FROM game_state WHERE user_id = :uid');
        $stmt->execute([':uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row !== false) {
            return [
                'user_id'    => $userId,
                'resources'  => json_decode($row['resources'], true) ?: ['ore' => 0, 'energy' => 0, 'credits' => 0],
                'units'      => json_decode($row['units'], true) ?: ['miners' => 0, 'drones' => 0, 'turrets' => 0],
                'faction'    => $row['faction'],
                'leaderboard'=> json_decode($row['leaderboard'], true) ?: [],
                'auctions'   => json_decode($row['auctions'], true) ?: []
            ];
        }
    }

    return defaultGameState($userId);
}

function persistState(PDO $pg = null, PDO $sqlite = null, array $state): void
{
    $resourcesJson   = json_encode($state['resources']);
    $unitsJson       = json_encode($state['units']);
    $leaderboardJson = json_encode($state['leaderboard']);
    $auctionsJson    = json_encode($state['auctions']);
    $faction         = $state['faction'];
    $userId          = $state['user_id'];

    if ($pg instanceof PDO) {
        $stmt = $pg->prepare(
            'INSERT INTO game_state (user_id, resources, units, faction, leaderboard, auctions)
             VALUES (:uid, :resources, :units, :faction, :leaderboard, :auctions)
             ON CONFLICT (user_id) DO UPDATE SET
               resources = EXCLUDED.resources,
               units = EXCLUDED.units,
               faction = EXCLUDED.faction,
               leaderboard = EXCLUDED.leaderboard,
               auctions = EXCLUDED.auctions,
               updated_at = NOW()'
        );
        $stmt->execute([
            ':uid'         => $userId,
            ':resources'   => $resourcesJson,
            ':units'       => $unitsJson,
            ':faction'     => $faction,
            ':leaderboard' => $leaderboardJson,
            ':auctions'    => $auctionsJson
        ]);
        return;
    }

    if ($sqlite instanceof PDO) {
        $sqlite->exec(
            'CREATE TABLE IF NOT EXISTS game_state (
                user_id TEXT PRIMARY KEY,
                resources TEXT,
                units TEXT,
                faction TEXT,
                leaderboard TEXT,
                auctions TEXT,
                created_at TEXT DEFAULT (datetime("now")),
                updated_at TEXT DEFAULT (datetime("now"))
            )'
        );
        $stmt = $sqlite->prepare(
            'INSERT INTO game_state (user_id, resources, units, faction, leaderboard, auctions)
             VALUES (:uid, :resources, :units, :faction, :leaderboard, :auctions)
             ON CONFLICT(user_id) DO UPDATE SET
               resources = excluded.resources,
               units = excluded.units,
               faction = excluded.faction,
               leaderboard = excluded.leaderboard,
               auctions = excluded.auctions,
               updated_at = datetime("now")'
        );
        $stmt->execute([
            ':uid'         => $userId,
            ':resources'   => $resourcesJson,
            ':units'       => $unitsJson,
            ':faction'     => $faction,
            ':leaderboard' => $leaderboardJson,
            ':auctions'    => $auctionsJson
        ]);
    }
}

function publishEvent(?ZMQSocket $socket, string $action, string $userId, array $payload): void
{
    if (!$socket instanceof ZMQSocket) {
        return;
    }
    $message = json_encode([
        'action'  => $action,
        'user_id' => $userId,
        'payload' => $payload
    ]);
    try {
        $socket->send($message);
    } catch (Throwable $e) {
        // ignore
    }
}

$didAuthEnabled = getenv('DID_AUTH_ENABLED') === 'true';
if ($didAuthEnabled) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (stripos($auth, 'Bearer ') !== 0) {
        respond(['error' => 'Missing bearer token'], 401);
    }
    $token = trim(substr($auth, 7));
    if (!validate_did_token($token)) {
        respond(['error' => 'Invalid DID token'], 401);
    }
} else {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $expected = getenv('STATIC_GAME_TOKEN') ?: 'Bearer game_token';
    if ($auth !== '' && $auth !== $expected) {
        // leave unauthenticated requests allowed for now (public load)
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? null);
if (!is_string($action)) {
    $body = getPostJson();
    $action = isset($body['action']) && is_string($body['action']) ? $body['action'] : null;
}
if ($action === null || !validateAction($action)) {
    respond(['error' => 'Invalid or missing action'], 400);
}

$body    = $method === 'POST' ? ($body ?? getPostJson()) : [];
$userId  = $body['user_id'] ?? ($_GET['user_id'] ?? null);
$userId  = is_string($userId) ? $userId : null;

if (!validateUserId($userId)) {
    respond(['error' => 'Invalid user_id'], 400);
}

$pg     = initPg();
$sqlite = $pg ? null : initSqlite($baseDir . '/..');
$redis  = initRedis();
$zmq    = initZmq();

try {
    $state = loadState($pg, $sqlite, $userId);

    switch ($action) {
        case 'load':
            respond(['state' => $state]);
            break;

        case 'join_faction':
            $faction = isset($body['faction']) && is_string($body['faction']) ? $body['faction'] : null;
            if ($faction === null || !preg_match('/^[A-Za-z0-9_\- ]{3,64}$/', $faction)) {
                respond(['error' => 'Invalid faction'], 400);
            }
            $state['faction'] = $faction;
            persistState($pg, $sqlite, $state);
            publishEvent($zmq, 'join_faction', $userId, ['faction' => $faction]);
            respond(['state' => $state]);
            break;

        case 'deploy':
            $unitType = $body['unit_type'] ?? null;
            if (!in_array($unitType, ['miners', 'drones', 'turrets'], true)) {
                respond(['error' => 'Invalid unit_type'], 400);
            }
            $costs = [
                'miners'  => ['ore' => 10, 'energy' => 5, 'credits' => 0],
                'drones'  => ['ore' => 5, 'energy' => 15, 'credits' => 2],
                'turrets' => ['ore' => 25, 'energy' => 10, 'credits' => 5],
            ];
            $cost = $costs[$unitType];

            foreach ($cost as $resKey => $resCost) {
                if ($state['resources'][$resKey] < $resCost) {
                    respond(['error' => 'Insufficient ' . $resKey], 400);
                }
            }
            foreach ($cost as $resKey => $resCost) {
                $state['resources'][$resKey] -= $resCost;
            }
            $state['units'][$unitType] += 1;

            persistState($pg, $sqlite, $state);
            publishEvent($zmq, 'deploy', $userId, [
                'unit_type' => $unitType,
                'resources' => $state['resources'],
                'units'     => $state['units']
            ]);
            respond(['state' => $state]);
            break;

        case 'trade':
            $from = $body['from'] ?? null;
            $to   = $body['to'] ?? null;
            $amt  = isset($body['amount']) ? (int)$body['amount'] : 0;

            $validResources = ['ore', 'energy', 'credits'];
            if (!in_array($from, $validResources, true) || !in_array($to, $validResources, true) || $from === $to) {
                respond(['error' => 'Invalid trade pair'], 400);
            }
            if ($amt <= 0) {
                respond(['error' => 'Invalid trade amount'], 400);
            }
            if ($state['resources'][$from] < $amt) {
                respond(['error' => 'Insufficient resources'], 400);
            }
            $rate = 1.0;
            if ($state['faction'] === 'Miners Guild' && $to === 'credits') {
                $rate = 2.5; // bonus
            }
            $gain = (int)floor($amt * $rate);
            $state['resources'][$from] -= $amt;
            $state['resources'][$to]   += $gain;

            persistState($pg, $sqlite, $state);
            publishEvent($zmq, 'trade', $userId, [
                'from'      => $from,
                'to'        => $to,
                'amount'    => $amt,
                'gain'      => $gain,
                'resources' => $state['resources']
            ]);
            respond(['state' => $state]);
            break;

        case 'auction':
            $item  = isset($body['item']) && is_string($body['item']) ? $body['item'] : null;
            $bid   = isset($body['bid']) ? (int)$body['bid'] : 0;
            if ($item === null || $bid <= 0) {
                respond(['error' => 'Invalid auction parameters'], 400);
            }
            if ($state['resources']['credits'] < $bid) {
                respond(['error' => 'Insufficient credits'], 400);
            }
            $state['resources']['credits'] -= $bid;
            $state['auctions'][] = [
                'user_id' => $userId,
                'item'    => $item,
                'bid'     => $bid,
                'ts'      => time()
            ];
            persistState($pg, $sqlite, $state);
            publishEvent($zmq, 'auction', $userId, [
                'item'     => $item,
                'bid'      => $bid,
                'resources'=> $state['resources'],
                'auctions' => $state['auctions']
            ]);
            respond(['state' => $state]);
            break;

        case 'embed':
            $analyticsCmd = 'resources';
            $analyticsPath = rtrim(getenv('STRATEGYFORGE_BASE_DIR') ?: $baseDir, '/') . '/python/game_analytics.py';
            $chartJson = '{}';
            if (is_file($analyticsPath) && is_executable(PHP_BINARY)) {
                $cmd = escapeshellcmd(PHP_BINARY) . ' ' . escapeshellarg($analyticsPath) . ' ' . escapeshellarg($analyticsCmd);
                $output = shell_exec($cmd);
                if (is_string($output) && trim($output) !== '') {
                    $chartJson = trim($output);
                }
            }
            $iframe = sprintf(
                '<iframe src="%s" title="StrategyForge Game Widget" style="width:100%%;height:720px;border:none;"></iframe>',
                '/game_widget.html'
            );
            publishEvent($zmq, 'embed', $userId, ['iframe' => true]);
            respond([
                'iframe_html' => $iframe,
                'chart'       => json_decode($chartJson, true)
            ]);
            break;

        default:
            respond(['error' => 'Unsupported action'], 400);
    }
} catch (Throwable $e) {
    recordError($pg, $sqlite, $userId, $e->getMessage());
    respond(['error' => 'Internal error'], 500);
}
