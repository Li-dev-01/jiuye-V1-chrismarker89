/**
 * AI标签推荐服务
 * 基于内容分析自动推荐相关标签
 */

interface TagRecommendation {
  tag_id: string;
  tag_name: string;
  confidence: number;
  reason: string;
}

interface ContentAnalysis {
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  industry?: string;
  skills?: string[];
}

export class AITagRecommendationService {
  
  /**
   * 分析内容并推荐标签
   */
  static async recommendTags(
    content: string, 
    title?: string, 
    contentType: 'story' | 'heart_voice' = 'story'
  ): Promise<TagRecommendation[]> {
    try {
      // 1. 内容分析
      const analysis = await this.analyzeContent(content, title);
      
      // 2. 获取可用标签
      const availableTags = await this.getAvailableTags(contentType);
      
      // 3. 匹配推荐标签
      const recommendations = await this.matchTags(analysis, availableTags);
      
      // 4. 按置信度排序
      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // 最多推荐5个标签
        
    } catch (error) {
      console.error('AI标签推荐失败:', error);
      return [];
    }
  }

  /**
   * 内容分析
   */
  private static async analyzeContent(content: string, title?: string): Promise<ContentAnalysis> {
    const fullText = `${title || ''} ${content}`.toLowerCase();
    
    // 关键词提取（简化版，实际可使用NLP库）
    const keywords = this.extractKeywords(fullText);
    
    // 情感分析（简化版）
    const sentiment = this.analyzeSentiment(fullText);
    
    // 主题识别
    const topics = this.identifyTopics(fullText);
    
    // 行业识别
    const industry = this.identifyIndustry(fullText);
    
    // 技能识别
    const skills = this.identifySkills(fullText);
    
    return {
      keywords,
      sentiment,
      topics,
      industry,
      skills
    };
  }

  /**
   * 关键词提取
   */
  private static extractKeywords(text: string): string[] {
    // 移除停用词
    const stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had'
    ]);
    
    // 简单分词和过滤
    const words = text
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 20);
    
    return [...new Set(words)]; // 去重
  }

  /**
   * 情感分析
   */
  private static analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['成功', '开心', '满意', '好', '棒', '优秀', '喜欢', '感谢', '希望', '成长'];
    const negativeWords = ['失败', '难过', '困难', '问题', '担心', '焦虑', '失望', '痛苦', '压力'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * 主题识别
   */
  private static identifyTopics(text: string): string[] {
    const topicKeywords = {
      '求职': ['求职', '面试', '简历', '招聘', '应聘', '找工作', 'job', 'interview', 'resume'],
      '转行': ['转行', '换工作', '职业转换', '跳槽', 'career change'],
      '创业': ['创业', '创业公司', '初创', '自主创业', 'startup', 'entrepreneur'],
      '技能': ['学习', '技能', '培训', '提升', '能力', 'skill', 'learning'],
      '职场': ['职场', '工作', '同事', '领导', '团队', 'workplace', 'colleague']
    };
    
    const topics: string[] = [];
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }

  /**
   * 行业识别
   */
  private static identifyIndustry(text: string): string | undefined {
    const industryKeywords = {
      '科技': ['程序员', '开发', '编程', '软件', '互联网', '科技', 'IT', 'tech', 'developer'],
      '金融': ['银行', '金融', '投资', '证券', '保险', 'finance', 'bank'],
      '教育': ['教育', '老师', '培训', '学校', '教学', 'education', 'teacher'],
      '医疗': ['医生', '护士', '医院', '医疗', '健康', 'medical', 'healthcare'],
      '设计': ['设计', '美工', '创意', 'design', 'creative'],
      '销售': ['销售', '市场', '营销', 'sales', 'marketing']
    };
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }
    
    return undefined;
  }

  /**
   * 技能识别
   */
  private static identifySkills(text: string): string[] {
    const skillKeywords = [
      'JavaScript', 'Python', 'Java', 'React', 'Vue', 'Node.js',
      'Photoshop', 'Excel', 'PPT', '英语', '沟通', '管理',
      '项目管理', '数据分析', '市场营销', '客户服务'
    ];
    
    return skillKeywords.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }

  /**
   * 获取可用标签
   */
  private static async getAvailableTags(contentType: string): Promise<any[]> {
    // 这里应该调用数据库获取标签
    // 简化版本，返回模拟数据
    return [
      { id: '1', tag_key: 'job-hunting', tag_name: '求职经历', content_type: 'story' },
      { id: '2', tag_key: 'tech-industry', tag_name: '科技行业', content_type: 'story' },
      { id: '3', tag_key: 'programming', tag_name: '编程开发', content_type: 'story' },
      { id: '4', tag_key: 'anxiety', tag_name: '焦虑困惑', content_type: 'heart_voice' },
      { id: '5', tag_key: 'hope', tag_name: '希望憧憬', content_type: 'heart_voice' },
      { id: '6', tag_key: 'success', tag_name: '成功喜悦', content_type: 'heart_voice' }
    ].filter(tag => tag.content_type === contentType || tag.content_type === 'all');
  }

  /**
   * 标签匹配
   */
  private static async matchTags(
    analysis: ContentAnalysis, 
    availableTags: any[]
  ): Promise<TagRecommendation[]> {
    const recommendations: TagRecommendation[] = [];
    
    for (const tag of availableTags) {
      let confidence = 0;
      let reason = '';
      
      // 基于关键词匹配
      const keywordMatch = analysis.keywords.some(keyword => 
        tag.tag_name.includes(keyword) || tag.tag_key.includes(keyword)
      );
      if (keywordMatch) {
        confidence += 0.3;
        reason += '关键词匹配; ';
      }
      
      // 基于主题匹配
      const topicMatch = analysis.topics.some(topic => 
        tag.tag_name.includes(topic)
      );
      if (topicMatch) {
        confidence += 0.4;
        reason += '主题匹配; ';
      }
      
      // 基于行业匹配
      if (analysis.industry && tag.tag_name.includes(analysis.industry)) {
        confidence += 0.3;
        reason += '行业匹配; ';
      }
      
      // 基于情感匹配（针对心声）
      if (tag.content_type === 'heart_voice') {
        if (analysis.sentiment === 'positive' && ['成功', '希望', '喜悦'].some(word => tag.tag_name.includes(word))) {
          confidence += 0.2;
          reason += '情感匹配; ';
        }
        if (analysis.sentiment === 'negative' && ['焦虑', '困惑', '压力'].some(word => tag.tag_name.includes(word))) {
          confidence += 0.2;
          reason += '情感匹配; ';
        }
      }
      
      // 只推荐置信度大于0.2的标签
      if (confidence > 0.2) {
        recommendations.push({
          tag_id: tag.id,
          tag_name: tag.tag_name,
          confidence: Math.min(confidence, 1.0),
          reason: reason.trim()
        });
      }
    }
    
    return recommendations;
  }
}
