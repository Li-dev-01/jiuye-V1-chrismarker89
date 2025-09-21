#!/usr/bin/env python3
"""
简单的管理员API服务
提供基本的管理员API端点
"""

from flask import Flask, jsonify
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# 模拟数据
MOCK_DASHBOARD_STATS = {
    "questionnaires": {
        "total_questionnaires": 156,
        "pending_questionnaires": 23,
        "approved_questionnaires": 128,
        "rejected_questionnaires": 5
    },
    "voices": {
        "total_voices": 89,
        "raw_voices": 12,
        "valid_voices": 77
    },
    "stories": {
        "total_stories": 45,
        "raw_stories": 8,
        "valid_stories": 37
    },
    "audits": {
        "total_audits": 234,
        "pending_audits": 15,
        "approved_audits": 201,
        "rejected_audits": 18,
        "human_reviews": 45
    },
    "users": {
        "total_users": 1234,
        "active_users": 567,
        "reviewers": 8,
        "admins": 3
    },
    "today": {
        "submissions": 12,
        "audits": 8
    }
}

MOCK_QUESTIONNAIRES = {
    "items": [
        {
            "id": 1,
            "session_id": "sess_12345",
            "completion_status": "completed",
            "completion_percentage": 100,
            "device_type": "desktop",
            "status": "approved",
            "submitted_at": "2024-08-01T10:30:00Z"
        },
        {
            "id": 2,
            "session_id": "sess_12346",
            "completion_status": "partial",
            "completion_percentage": 75,
            "device_type": "mobile",
            "status": "pending",
            "submitted_at": "2024-08-01T11:15:00Z"
        }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 10,
    "totalPages": 16
}

@app.route('/api/admin/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """获取仪表板统计数据"""
    return jsonify({
        "success": True,
        "data": MOCK_DASHBOARD_STATS,
        "message": "获取仪表板统计成功",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/admin/questionnaires', methods=['GET'])
def get_questionnaires():
    """获取问卷列表"""
    return jsonify({
        "success": True,
        "data": MOCK_QUESTIONNAIRES,
        "message": "获取问卷列表成功",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    """获取用户列表"""
    return jsonify({
        "success": True,
        "data": {
            "items": [],
            "total": 0,
            "page": 1,
            "pageSize": 10,
            "totalPages": 0
        },
        "message": "获取用户列表成功",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/admin/users/stats', methods=['GET'])
def get_user_stats():
    """获取用户统计"""
    return jsonify({
        "success": True,
        "data": {
            "total_users": 1234,
            "active_users": 567,
            "new_users_today": 12,
            "user_types": {
                "guest": 1000,
                "registered": 200,
                "reviewer": 8,
                "admin": 3
            }
        },
        "message": "获取用户统计成功",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/admin/reviewers', methods=['GET'])
def get_reviewers():
    """获取审核员列表"""
    return jsonify({
        "success": True,
        "data": {
            "items": [],
            "total": 0,
            "page": 1,
            "pageSize": 10,
            "totalPages": 0
        },
        "message": "获取审核员列表成功",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/admin/content/categories', methods=['GET'])
def get_content_categories():
    """获取内容分类"""
    return jsonify({
        "success": True,
        "data": [],
        "message": "获取内容分类成功",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/admin/content/tags', methods=['GET'])
def get_content_tags():
    """获取内容标签"""
    return jsonify({
        "success": True,
        "data": [],
        "message": "获取内容标签成功",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        "status": "healthy",
        "service": "Admin API",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🔧 Starting Simple Admin API Server...")
    print("🎯 Features:")
    print("   • Dashboard statistics")
    print("   • Questionnaire management")
    print("   • User management")
    print("   • Content management")
    print("")
    print("🔌 Available endpoints:")
    print("   GET  /api/admin/dashboard/stats - Get dashboard statistics")
    print("   GET  /api/admin/questionnaires - Get questionnaires list")
    print("   GET  /api/admin/users - Get users list")
    print("   GET  /api/admin/users/stats - Get user statistics")
    print("   GET  /api/admin/reviewers - Get reviewers list")
    print("   GET  /api/admin/content/categories - Get content categories")
    print("   GET  /api/admin/content/tags - Get content tags")
    print("")
    print("🌐 Server running on: http://localhost:8007")
    print("📝 CORS enabled for frontend integration")
    print("")
    
    app.run(host='0.0.0.0', port=8007, debug=True)
