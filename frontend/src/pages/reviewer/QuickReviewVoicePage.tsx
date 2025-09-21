import React from 'react';
import { ReviewerLayout } from '../../components/layout/RoleBasedLayout';
import { QuickReviewComponent } from '../../components/reviewer/QuickReviewComponent';

export const QuickReviewVoicePage: React.FC = () => {
  return (
    <ReviewerLayout>
      <QuickReviewComponent
        contentType="voice"
        title="心声快速审核"
        description="快速审核用户提交的心声内容，确保内容质量和合规性。使用键盘快捷键可以提高审核效率。"
      />
    </ReviewerLayout>
  );
};
