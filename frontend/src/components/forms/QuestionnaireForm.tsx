import React, { useState } from 'react';
import { Form, Button, Steps, Card, message, Space } from 'antd';
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { QuestionnaireFormData } from '../../types/questionnaire';
import { PersonalInfoStep } from './PersonalInfoStep';
import { EducationInfoStep } from './EducationInfoStep';
import { EmploymentInfoStep } from './EmploymentInfoStep';
import { JobSearchInfoStep } from './JobSearchInfoStep';
import { EmploymentStatusStep } from './EmploymentStatusStep';
import { useQuestionnaireStore } from '../../stores/questionnaireStore';
import { ParticipationStatsComponent } from '../common/ParticipationStats';
import styles from './QuestionnaireForm.module.css';

const FORM_STEPS = [
  {
    key: 'personal',
    title: '个人信息',
    description: '基本个人信息',
    component: PersonalInfoStep
  },
  {
    key: 'education',
    title: '教育背景',
    description: '学历和专业信息',
    component: EducationInfoStep
  },
  {
    key: 'employment',
    title: '就业意向',
    description: '期望行业和职位',
    component: EmploymentInfoStep
  },
  {
    key: 'jobSearch',
    title: '求职过程',
    description: '求职经历和结果',
    component: JobSearchInfoStep
  },
  {
    key: 'status',
    title: '就业状态',
    description: '当前工作状况',
    component: EmploymentStatusStep
  }
];

export const QuestionnaireForm: React.FC = () => {
  const [form] = Form.useForm<QuestionnaireFormData>();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<QuestionnaireFormData>>({});
  const { submitQuestionnaire, isLoading, error } = useQuestionnaireStore();
  const navigate = useNavigate();

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleNext = async () => {
    try {
      // 验证当前步骤的字段
      const currentStepKey = FORM_STEPS[currentStep].key;
      const fieldsToValidate = getFieldsForStep(currentStepKey);
      
      await form.validateFields(fieldsToValidate);
      
      if (currentStep < FORM_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      message.error('请完善当前步骤的必填信息');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 跳转到问卷完成页面，传递问卷数据
      navigate('/questionnaire-completion', {
        state: {
          questionnaireData: values
        }
      });

    } catch (error) {
      if (error.errorFields) {
        message.error('请完善所有必填信息');
      } else {
        message.error('提交失败，请稍后重试');
      }
    }
  };

  const getFieldsForStep = (stepKey: string) => {
    const fieldMap: Record<string, string[]> = {
      personal: [
        ['personalInfo', 'name'],
        ['personalInfo', 'gender'],
        ['personalInfo', 'age'],
        ['personalInfo', 'phone'],
        ['personalInfo', 'email']
      ],
      education: [
        ['educationInfo', 'university'],
        ['educationInfo', 'major'],
        ['educationInfo', 'degree'],
        ['educationInfo', 'graduationYear']
      ],
      employment: [
        ['employmentInfo', 'preferredIndustry'],
        ['employmentInfo', 'preferredPosition'],
        ['employmentInfo', 'expectedSalary'],
        ['employmentInfo', 'preferredLocation'],
        ['employmentInfo', 'workExperience']
      ],
      jobSearch: [
        ['jobSearchInfo', 'searchChannels'],
        ['jobSearchInfo', 'interviewCount'],
        ['jobSearchInfo', 'offerCount'],
        ['jobSearchInfo', 'searchDuration']
      ],
      status: [
        ['employmentStatus', 'currentStatus']
      ]
    };
    
    return fieldMap[stepKey] || [];
  };

  const CurrentStepComponent = FORM_STEPS[currentStep].component;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 参与统计 */}
        <ParticipationStatsComponent
          pageType="questionnaire"
          compact={true}
          showRefreshButton={false}
          style={{ marginBottom: '16px' }}
        />

        {/* 进度指示器 */}
        <Card className={styles.progressCard}>
          <Steps
            current={currentStep}
            onChange={handleStepChange}
            className={styles.steps}
            size="small"
            responsive={false}
            items={FORM_STEPS.map((step, index) => ({
              key: step.key,
              title: step.title,
              description: window.innerWidth > 768 ? step.description : undefined,
              status: index < currentStep ? 'finish' :
                      index === currentStep ? 'process' : 'wait'
            }))}
          />

          <div className={styles.progressText}>
            第 {currentStep + 1} 步，共 {FORM_STEPS.length} 步
          </div>
        </Card>

        {/* 表单内容 */}
        <Card className={styles.formCard}>
          <Form
            form={form}
            layout="vertical"
            size="large"
            initialValues={formData}
            onValuesChange={(_, allValues) => setFormData(allValues)}
          >
            <CurrentStepComponent
              value={formData[FORM_STEPS[currentStep].key as keyof QuestionnaireFormData]}
              onChange={(value) => {
                const stepKey = FORM_STEPS[currentStep].key as keyof QuestionnaireFormData;
                setFormData(prev => ({
                  ...prev,
                  [stepKey]: value
                }));
                form.setFieldsValue({
                  [stepKey]: value
                });
              }}
            />

            {/* 错误提示 */}
            {error && (
              <div className={styles.errorMessage}>
                <p>{error}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className={styles.buttonContainer}>
              <Button
                size="large"
                onClick={handlePrev}
                disabled={currentStep === 0}
                icon={<LeftOutlined />}
                className={styles.secondaryButton}
              >
                上一步
              </Button>

              <Space>
                <span className={styles.stepCounter}>
                  {currentStep + 1} / {FORM_STEPS.length}
                </span>
              </Space>

              {currentStep < FORM_STEPS.length - 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleNext}
                  icon={<RightOutlined />}
                  iconPosition="end"
                  className={styles.primaryButton}
                >
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={isLoading}
                  icon={<CheckOutlined />}
                  className={styles.primaryButton}
                >
                  {isLoading ? '提交中...' : '提交问卷'}
                </Button>
              )}
            </div>
          </Form>
        </Card>

        {/* 帮助信息 */}
        <div className={styles.helpInfo}>
          <p>遇到问题？请联系我们：survey@example.com</p>
          <p>预计完成时间：5-10分钟</p>
        </div>
      </div>
    </div>
  );
};
