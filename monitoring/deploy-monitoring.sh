#!/bin/bash

# 就业调查系统监控部署脚本
# 自动部署Prometheus + Grafana + AlertManager监控栈

set -e

echo "🚀 开始部署就业调查系统监控栈..."
echo "📅 部署时间: $(date)"
echo "👤 执行用户: $(whoami)"
echo "📂 当前目录: $(pwd)"
echo ""

# 检查Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建监控目录结构..."
mkdir -p monitoring/{prometheus,grafana/{dashboards,datasources},alertmanager,blackbox,loki,promtail}

# 创建Grafana数据源配置
echo "📊 配置Grafana数据源..."
cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: true
EOF

# 创建Grafana仪表板配置
echo "📈 配置Grafana仪表板..."
cat > monitoring/grafana/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

# 创建Blackbox Exporter配置
echo "🔍 配置Blackbox Exporter..."
cat > monitoring/blackbox/blackbox.yml << EOF
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []
      method: GET
      
  http_post_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []
      method: POST
      
  tcp_connect:
    prober: tcp
    timeout: 5s
    
  icmp:
    prober: icmp
    timeout: 5s
EOF

# 创建Loki配置
echo "📝 配置Loki日志聚合..."
cat > monitoring/loki/loki-config.yml << EOF
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 1h
  max_chunk_age: 1h
  chunk_target_size: 1048576
  chunk_retain_period: 30s
  max_transfer_retries: 0

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
    cache_ttl: 24h
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s

ruler:
  storage:
    type: local
    local:
      directory: /loki/rules
  rule_path: /loki/rules
  alertmanager_url: http://alertmanager:9093
  ring:
    kvstore:
      store: inmemory
  enable_api: true
EOF

# 创建Promtail配置
echo "📋 配置Promtail日志收集..."
cat > monitoring/promtail/promtail-config.yml << EOF
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log
          
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*log
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs:
      - json:
          expressions:
            tag:
          source: attrs
      - regex:
          expression: (?P<container_name>(?:[^|]*))\|
          source: tag
      - timestamp:
          format: RFC3339Nano
          source: time
      - labels:
          stream:
          container_name:
      - output:
          source: output
EOF

# 设置权限
echo "🔐 设置文件权限..."
chmod +x monitoring/deploy-monitoring.sh

# 启动监控栈
echo "🚀 启动监控服务..."
cd monitoring
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 显示访问信息
echo ""
echo "✅ 监控栈部署完成！"
echo ""
echo "📊 访问地址："
echo "  Prometheus: http://localhost:9090"
echo "  Grafana:    http://localhost:3000 (admin/admin123)"
echo "  AlertManager: http://localhost:9093"
echo "  Node Exporter: http://localhost:9100"
echo "  cAdvisor:   http://localhost:8080"
echo ""
echo "📈 Grafana默认仪表板："
echo "  - API概览仪表板已自动导入"
echo "  - 可以通过Grafana界面导入更多仪表板"
echo ""
echo "🔔 告警配置："
echo "  - 请在 alertmanager/alertmanager.yml 中配置邮件通知"
echo "  - 默认告警规则已配置，可根据需要调整"
echo ""
echo "📝 日志聚合："
echo "  - Loki: http://localhost:3100"
echo "  - 日志可在Grafana中通过Loki数据源查看"
echo ""
echo "🛠️ 管理命令："
echo "  启动: docker-compose up -d"
echo "  停止: docker-compose down"
echo "  查看日志: docker-compose logs -f [service_name]"
echo "  重启: docker-compose restart [service_name]"
echo ""
echo "⚠️  注意事项："
echo "  1. 请确保防火墙允许相关端口访问"
echo "  2. 生产环境请修改默认密码"
echo "  3. 配置邮件通知以接收告警"
echo "  4. 定期备份监控数据"
echo ""
echo "🎉 监控系统已就绪，开始监控您的就业调查系统！"
