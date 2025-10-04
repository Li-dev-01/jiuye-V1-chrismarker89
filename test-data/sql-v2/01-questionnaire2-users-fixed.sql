-- 清理问卷2测试数据
DELETE FROM questionnaire_v2_answers WHERE is_test_data = 1;
DELETE FROM questionnaire_v2_analytics WHERE is_test_data = 1;
DELETE FROM questionnaire_v2_responses WHERE is_test_data = 1;
DELETE FROM users WHERE email LIKE "q2_test_%";

-- 插入问卷2测试用户 (适配现有users表结构)
INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES
('q2_user_05df7ef283e855bd', 'q2_test_0000', 'q2_test_0000@test.example.com', 'test_hash', 'user', '2025-08-08T01:25:17.520Z', '2025-08-08T01:25:17.520Z'),
('q2_user_e6b27887dc3d93c9', 'q2_test_0001', 'q2_test_0001@test.example.com', 'test_hash', 'user', '2025-07-21T21:36:41.133Z', '2025-07-21T21:36:41.133Z'),
('q2_user_02afb624df0b1fa0', 'q2_test_0002', 'q2_test_0002@test.example.com', 'test_hash', 'user', '2025-08-10T19:36:23.598Z', '2025-08-10T19:36:23.598Z'),
('q2_user_8d8c1f0e35c834cc', 'q2_test_0003', 'q2_test_0003@test.example.com', 'test_hash', 'user', '2025-07-20T02:31:35.409Z', '2025-07-20T02:31:35.409Z'),
('q2_user_b5e8f9a2c1d3e4f5', 'q2_test_0004', 'q2_test_0004@test.example.com', 'test_hash', 'user', '2025-08-15T10:30:45.123Z', '2025-08-15T10:30:45.123Z'),
('q2_user_c6f9a0b3d2e4f5g6', 'q2_test_0005', 'q2_test_0005@test.example.com', 'test_hash', 'user', '2025-08-20T14:25:30.456Z', '2025-08-20T14:25:30.456Z'),
('q2_user_d7g0a1b4e3f5g6h7', 'q2_test_0006', 'q2_test_0006@test.example.com', 'test_hash', 'user', '2025-08-25T16:45:12.789Z', '2025-08-25T16:45:12.789Z'),
('q2_user_e8h1a2b5f4g6h7i8', 'q2_test_0007', 'q2_test_0007@test.example.com', 'test_hash', 'user', '2025-09-01T09:15:20.012Z', '2025-09-01T09:15:20.012Z'),
('q2_user_f9i2a3b6g5h7i8j9', 'q2_test_0008', 'q2_test_0008@test.example.com', 'test_hash', 'user', '2025-09-05T11:30:55.345Z', '2025-09-05T11:30:55.345Z'),
('q2_user_g0j3a4b7h6i8j9k0', 'q2_test_0009', 'q2_test_0009@test.example.com', 'test_hash', 'user', '2025-09-10T13:20:40.678Z', '2025-09-10T13:20:40.678Z');
