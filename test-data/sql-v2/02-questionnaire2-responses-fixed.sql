-- 插入问卷2回答数据 (使用正确的用户ID)
INSERT INTO questionnaire_v2_responses (
  id, user_id, questionnaire_id, status, basic_info,
  economic_pressure_data, employment_confidence_data, modern_debt_data,
  created_at, submitted_at, completion_time, is_test_data
) VALUES
('q2_response_test_001', 'q2_user_05df7ef283e855bd', 'questionnaire-v2-2024', 'completed', 
 '{"ageRange":"20-22","educationLevel":"bachelor","currentLocation":"tier1","familyEconomicStatus":"middle"}', 
 '{"monthlyCost":2271,"familySupport":737,"partTimeIncome":534,"stressLevel":"medium","concernAreas":["food"],"planningAbility":"good"}', 
 '{"marketOutlook":"pessimistic","competitiveness":"very-strong","skillPreparation":63,"careerClarity":61,"jobSearchConfidence":"neutral","industryConfidence":86}', 
 '{"debtTypes":["credit-card","family-loan"],"debtAmount":40842,"repaymentPressure":"none","careerImpact":"slight","financialLiteracy":71,"managementStrategy":"proactive"}', 
 '2025-09-07T10:14:57.834Z', '2025-09-08T04:42:32.001Z', 673, 1),

('q2_response_test_002', 'q2_user_e6b27887dc3d93c9', 'questionnaire-v2-2024', 'completed', 
 '{"ageRange":"23-25","educationLevel":"master","currentLocation":"tier2","familyEconomicStatus":"well-off"}', 
 '{"monthlyCost":3996,"familySupport":1676,"partTimeIncome":822,"stressLevel":"low","concernAreas":["housing","education"],"planningAbility":"excellent"}', 
 '{"marketOutlook":"optimistic","competitiveness":"average","skillPreparation":83,"careerClarity":63,"jobSearchConfidence":"confident","industryConfidence":99}', 
 '{"debtTypes":["student-loan","online-loan"],"debtAmount":7646,"repaymentPressure":"medium","careerImpact":"significant","financialLiteracy":73,"managementStrategy":"planned"}', 
 '2025-09-08T19:36:18.882Z', '2025-09-21T22:58:05.333Z', 869, 1),

('q2_response_test_003', 'q2_user_02afb624df0b1fa0', 'questionnaire-v2-2024', 'completed', 
 '{"ageRange":"26-28","educationLevel":"bachelor","currentLocation":"tier3","familyEconomicStatus":"struggling"}', 
 '{"monthlyCost":1930,"familySupport":1211,"partTimeIncome":659,"stressLevel":"high","concernAreas":["housing","transportation"],"planningAbility":"poor"}', 
 '{"marketOutlook":"pessimistic","competitiveness":"weak","skillPreparation":45,"careerClarity":30,"jobSearchConfidence":"worried","industryConfidence":40}', 
 '{"debtTypes":["credit-card","online-loan","family-loan"],"debtAmount":21008,"repaymentPressure":"high","careerImpact":"severe","financialLiteracy":45,"managementStrategy":"reactive"}', 
 '2025-08-07T12:33:23.904Z', '2025-09-05T00:55:17.189Z', 797, 1),

('q2_response_test_004', 'q2_user_8d8c1f0e35c834cc', 'questionnaire-v2-2024', 'completed', 
 '{"ageRange":"20-22","educationLevel":"college","currentLocation":"tier1","familyEconomicStatus":"middle"}', 
 '{"monthlyCost":2500,"familySupport":800,"partTimeIncome":600,"stressLevel":"medium","concernAreas":["food","entertainment"],"planningAbility":"good"}', 
 '{"marketOutlook":"neutral","competitiveness":"strong","skillPreparation":75,"careerClarity":80,"jobSearchConfidence":"confident","industryConfidence":85}', 
 '{"debtTypes":["student-loan","alipay-huabei"],"debtAmount":15000,"repaymentPressure":"medium","careerImpact":"moderate","financialLiteracy":65,"managementStrategy":"planned"}', 
 '2025-08-15T14:20:30.123Z', '2025-08-16T10:45:15.456Z', 720, 1),

('q2_response_test_005', 'q2_user_b5e8f9a2c1d3e4f5', 'questionnaire-v2-2024', 'completed', 
 '{"ageRange":"29-35","educationLevel":"master","currentLocation":"tier1","familyEconomicStatus":"well-off"}', 
 '{"monthlyCost":4500,"familySupport":2000,"partTimeIncome":1200,"stressLevel":"low","concernAreas":["housing"],"planningAbility":"excellent"}', 
 '{"marketOutlook":"optimistic","competitiveness":"very-strong","skillPreparation":90,"careerClarity":95,"jobSearchConfidence":"very-confident","industryConfidence":95}', 
 '{"debtTypes":["mortgage","car-loan"],"debtAmount":500000,"repaymentPressure":"low","careerImpact":"no-impact","financialLiteracy":85,"managementStrategy":"proactive"}', 
 '2025-08-20T16:30:45.789Z', '2025-08-21T09:15:20.012Z', 650, 1);
