# StrategyForge Monitoring Stack

Namespace:

```bash
kubectl create namespace monitoring
```

Prometheus:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  -f infra/monitoring/prometheus-values.yaml
```

Grafana:

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana \
  --namespace monitoring \
  -f infra/monitoring/grafana-values.yaml
```

Loki + Promtail:

```bash
helm install loki grafana/loki-stack \
  --namespace monitoring \
  -f infra/monitoring/loki-promtail-values.yaml
Expose Grafana via LoadBalancer or Ingress and configure dashboards to consume:

API metrics (/metrics) from php-api pods

RAG metrics (/metrics) from rag-service pods

Socket gateway logs via Loki + Promtail.
```
