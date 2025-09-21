/**
 * 问卷条件逻辑测试
 * 验证所有条件逻辑的正确性
 */

import {
  EDUCATION_SCHOOL_MAPPING,
  SCHOOL_TYPE_LABELS,
  EDUCATION_LABELS,
  getAvailableSchoolTypes,
  validateEducationSchoolCombination,
  getEducationLabel,
  getSchoolTypeLabel,
  evaluateCondition,
  shouldShowQuestion,
  getAvailableOptions,
  cleanupFormData,
  getFormValidationErrors
} from '../questionnaireLogic';

describe('问卷条件逻辑测试', () => {
  
  describe('学历-院校类型映射', () => {
    test('高中及以下学历应该只能选择职业学校和其他', () => {
      const availableTypes = getAvailableSchoolTypes('high-school');
      expect(availableTypes).toEqual(['vocational', 'other']);
      expect(availableTypes).not.toContain('985');
      expect(availableTypes).not.toContain('211');
    });

    test('大专学历应该只能选择专科院校和其他', () => {
      const availableTypes = getAvailableSchoolTypes('junior-college');
      expect(availableTypes).toEqual(['vocational', 'other']);
      expect(availableTypes).not.toContain('985');
      expect(availableTypes).not.toContain('regular-public');
    });

    test('本科学历应该能选择所有本科院校类型', () => {
      const availableTypes = getAvailableSchoolTypes('bachelor');
      expect(availableTypes).toContain('985');
      expect(availableTypes).toContain('211');
      expect(availableTypes).toContain('regular-public');
      expect(availableTypes).toContain('private');
      expect(availableTypes).not.toContain('vocational');
    });

    test('硕士学历应该包含研究院所', () => {
      const availableTypes = getAvailableSchoolTypes('master');
      expect(availableTypes).toContain('985');
      expect(availableTypes).toContain('research-institute');
      expect(availableTypes).toContain('overseas');
    });

    test('博士学历应该主要是高水平院校和研究院所', () => {
      const availableTypes = getAvailableSchoolTypes('phd');
      expect(availableTypes).toContain('985');
      expect(availableTypes).toContain('211');
      expect(availableTypes).toContain('research-institute');
      expect(availableTypes).toContain('overseas');
      expect(availableTypes).not.toContain('vocational');
      expect(availableTypes).not.toContain('private');
    });

    test('无效学历应该返回空数组', () => {
      const availableTypes = getAvailableSchoolTypes('invalid-education');
      expect(availableTypes).toEqual([]);
    });
  });

  describe('学历-院校组合验证', () => {
    test('有效组合应该通过验证', () => {
      // 本科 + 985
      let result = validateEducationSchoolCombination('bachelor', '985');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();

      // 大专 + 专科院校
      result = validateEducationSchoolCombination('junior-college', 'vocational');
      expect(result.valid).toBe(true);

      // 博士 + 研究院所
      result = validateEducationSchoolCombination('phd', 'research-institute');
      expect(result.valid).toBe(true);
    });

    test('无效组合应该被拒绝', () => {
      // 大专 + 985 (无效)
      let result = validateEducationSchoolCombination('junior-college', '985');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('大专');
      expect(result.message).toContain('985高校');
      expect(result.message).toContain('不匹配');

      // 高中 + 211 (无效)
      result = validateEducationSchoolCombination('high-school', '211');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('高中及以下');
      expect(result.message).toContain('211高校');

      // 博士 + 民办本科 (无效)
      result = validateEducationSchoolCombination('phd', 'private');
      expect(result.valid).toBe(false);
    });

    test('空值应该通过验证', () => {
      let result = validateEducationSchoolCombination('', '985');
      expect(result.valid).toBe(true);

      result = validateEducationSchoolCombination('bachelor', '');
      expect(result.valid).toBe(true);

      result = validateEducationSchoolCombination('', '');
      expect(result.valid).toBe(true);
    });
  });

  describe('标签获取功能', () => {
    test('应该正确获取学历标签', () => {
      expect(getEducationLabel('bachelor')).toBe('本科');
      expect(getEducationLabel('master')).toBe('硕士研究生');
      expect(getEducationLabel('phd')).toBe('博士研究生');
      expect(getEducationLabel('invalid')).toBe('invalid');
    });

    test('应该正确获取院校类型标签', () => {
      expect(getSchoolTypeLabel('985')).toBe('985高校');
      expect(getSchoolTypeLabel('211')).toBe('211高校（非985）');
      expect(getSchoolTypeLabel('vocational')).toBe('专科院校');
      expect(getSchoolTypeLabel('invalid')).toBe('invalid');
    });
  });

  describe('条件评估功能', () => {
    test('equals操作符应该正确工作', () => {
      expect(evaluateCondition('test', 'equals', 'test')).toBe(true);
      expect(evaluateCondition('test', 'equals', 'other')).toBe(false);
      expect(evaluateCondition(null, 'equals', null)).toBe(true);
    });

    test('not_equals操作符应该正确工作', () => {
      expect(evaluateCondition('test', 'not_equals', 'other')).toBe(true);
      expect(evaluateCondition('test', 'not_equals', 'test')).toBe(false);
      expect(evaluateCondition(null, 'not_equals', 'test')).toBe(true);
    });

    test('in操作符应该正确工作', () => {
      expect(evaluateCondition('test', 'in', ['test', 'other'])).toBe(true);
      expect(evaluateCondition('test', 'in', ['other', 'another'])).toBe(false);
      expect(evaluateCondition('test', 'in', [])).toBe(false);
    });

    test('contains操作符应该正确工作', () => {
      expect(evaluateCondition(['test', 'other'], 'contains', 'test')).toBe(true);
      expect(evaluateCondition(['test', 'other'], 'contains', 'missing')).toBe(false);
      expect(evaluateCondition([], 'contains', 'test')).toBe(false);
    });
  });

  describe('问题显示条件', () => {
    test('院校类型问题应该依赖学历选择', () => {
      // 没有选择学历时不显示
      let formData = {};
      expect(shouldShowQuestion('university-tier', formData)).toBe(false);

      // 选择学历后显示
      formData = { 'education-level': 'bachelor' };
      expect(shouldShowQuestion('university-tier', formData)).toBe(true);
    });

    test('工作满意度应该只在已就业时显示', () => {
      // 未就业时不显示
      let formData = { 'current-status': 'unemployed' };
      expect(shouldShowQuestion('job-satisfaction', formData)).toBe(false);

      // 全职工作时显示
      formData = { 'current-status': 'fulltime' };
      expect(shouldShowQuestion('job-satisfaction', formData)).toBe(true);

      // 兼职工作时显示
      formData = { 'current-status': 'parttime' };
      expect(shouldShowQuestion('job-satisfaction', formData)).toBe(true);
    });

    test('求职时长应该只在求职中时显示', () => {
      // 已就业时不显示
      let formData = { 'current-status': 'fulltime' };
      expect(shouldShowQuestion('job-search-duration', formData)).toBe(false);

      // 求职中时显示
      formData = { 'current-status': 'unemployed' };
      expect(shouldShowQuestion('job-search-duration', formData)).toBe(true);
    });

    test('没有条件的问题应该总是显示', () => {
      const formData = {};
      expect(shouldShowQuestion('education-level', formData)).toBe(true);
      expect(shouldShowQuestion('gender', formData)).toBe(true);
      expect(shouldShowQuestion('age-range', formData)).toBe(true);
    });
  });

  describe('选项过滤功能', () => {
    const originalOptions = [
      { value: '985', label: '985高校' },
      { value: '211', label: '211高校（非985）' },
      { value: 'vocational', label: '专科院校' },
      { value: 'private', label: '民办本科' },
      { value: 'other', label: '其他' }
    ];

    test('院校类型选项应该根据学历过滤', () => {
      // 本科学历
      let formData = { 'education-level': 'bachelor' };
      let filteredOptions = getAvailableOptions('university-tier', formData, originalOptions);
      expect(filteredOptions.map(o => o.value)).toContain('985');
      expect(filteredOptions.map(o => o.value)).toContain('private');
      expect(filteredOptions.map(o => o.value)).not.toContain('vocational');

      // 大专学历
      formData = { 'education-level': 'junior-college' };
      filteredOptions = getAvailableOptions('university-tier', formData, originalOptions);
      expect(filteredOptions.map(o => o.value)).toContain('vocational');
      expect(filteredOptions.map(o => o.value)).toContain('other');
      expect(filteredOptions.map(o => o.value)).not.toContain('985');
    });

    test('没有学历选择时应该返回空选项', () => {
      const formData = {};
      const filteredOptions = getAvailableOptions('university-tier', formData, originalOptions);
      expect(filteredOptions).toEqual([]);
    });

    test('其他问题应该返回原始选项', () => {
      const formData = { 'education-level': 'bachelor' };
      const filteredOptions = getAvailableOptions('other-question', formData, originalOptions);
      expect(filteredOptions).toEqual(originalOptions);
    });
  });

  describe('表单数据清理', () => {
    test('学历变更应该清理不匹配的院校类型', () => {
      const formData = {
        'education-level': 'bachelor',
        'university-tier': '985'
      };

      // 改为大专，985应该被清空
      const cleanedData = cleanupFormData('education-level', 'junior-college', formData);
      expect(cleanedData['education-level']).toBe('junior-college');
      expect(cleanedData['university-tier']).toBeNull();
    });

    test('匹配的组合应该保持不变', () => {
      const formData = {
        'education-level': 'bachelor',
        'university-tier': '985'
      };

      // 改为硕士，985仍然有效
      const cleanedData = cleanupFormData('education-level', 'master', formData);
      expect(cleanedData['education-level']).toBe('master');
      expect(cleanedData['university-tier']).toBe('985');
    });

    test('其他字段变更不应该影响院校类型', () => {
      const formData = {
        'education-level': 'bachelor',
        'university-tier': '985',
        'gender': 'male'
      };

      const cleanedData = cleanupFormData('gender', 'female', formData);
      expect(cleanedData['gender']).toBe('female');
      expect(cleanedData['university-tier']).toBe('985');
    });
  });

  describe('表单验证错误', () => {
    test('应该检测学历-院校不匹配错误', () => {
      const formData = {
        'education-level': 'junior-college',
        'university-tier': '985'
      };

      const errors = getFormValidationErrors(formData);
      expect(errors['university-tier']).toContain('不匹配');
    });

    test('有效组合不应该有错误', () => {
      const formData = {
        'education-level': 'bachelor',
        'university-tier': '985'
      };

      const errors = getFormValidationErrors(formData);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('空值不应该产生错误', () => {
      const formData = {
        'education-level': '',
        'university-tier': ''
      };

      const errors = getFormValidationErrors(formData);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});

// 集成测试
describe('条件逻辑集成测试', () => {
  test('完整的学历选择流程', () => {
    let formData = {};

    // 1. 选择学历
    formData = cleanupFormData('education-level', 'bachelor', formData);
    expect(formData['education-level']).toBe('bachelor');

    // 2. 检查院校类型选项
    const originalOptions = [
      { value: '985', label: '985高校' },
      { value: 'vocational', label: '专科院校' }
    ];
    const availableOptions = getAvailableOptions('university-tier', formData, originalOptions);
    expect(availableOptions.map(o => o.value)).toContain('985');
    expect(availableOptions.map(o => o.value)).not.toContain('vocational');

    // 3. 选择院校类型
    formData = cleanupFormData('university-tier', '985', formData);
    expect(formData['university-tier']).toBe('985');

    // 4. 验证组合
    const validation = validateEducationSchoolCombination(
      formData['education-level'],
      formData['university-tier']
    );
    expect(validation.valid).toBe(true);

    // 5. 检查表单错误
    const errors = getFormValidationErrors(formData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  test('学历变更导致院校类型清理的完整流程', () => {
    // 初始状态：本科 + 985
    let formData = {
      'education-level': 'bachelor',
      'university-tier': '985'
    };

    // 验证初始状态有效
    let errors = getFormValidationErrors(formData);
    expect(Object.keys(errors)).toHaveLength(0);

    // 改为大专
    formData = cleanupFormData('education-level', 'junior-college', formData);
    expect(formData['education-level']).toBe('junior-college');
    expect(formData['university-tier']).toBeNull(); // 985被清空

    // 验证清理后无错误
    errors = getFormValidationErrors(formData);
    expect(Object.keys(errors)).toHaveLength(0);

    // 选择匹配的院校类型
    formData = cleanupFormData('university-tier', 'vocational', formData);
    expect(formData['university-tier']).toBe('vocational');

    // 最终验证
    const validation = validateEducationSchoolCombination(
      formData['education-level'],
      formData['university-tier']
    );
    expect(validation.valid).toBe(true);
  });
});
