/**
 * 问题渲染器组件
 * 
 * 功能特性：
 * - 根据问题类型动态渲染不同的输入组件
 * - 处理用户输入和验证
 * - 实时更新统计数据
 * - 支持自定义样式和主题
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Star,
  Upload,
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';

import { Question, QuestionStatistics } from '../types/question.types';
import { StatisticsChart } from './StatisticsChart';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onBlur?: (value: any) => void;
  error?: string;
  disabled?: boolean;
  showStatistics?: boolean;
  statistics?: QuestionStatistics;
  theme?: string;
  className?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  showStatistics = false,
  statistics,
  theme = 'default',
  className = ''
}) => {
  const [showStatsDetails, setShowStatsDetails] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 处理输入变化
  const handleChange = useCallback((newValue: any) => {
    onChange(newValue);
  }, [onChange]);

  // 处理失焦
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.(value);
  }, [onBlur, value]);

  // 处理聚焦
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // 渲染问题标题
  const renderQuestionTitle = () => (
    <div className="question-title mb-3">
      <Label className="text-base font-medium flex items-center gap-2">
        {question.title}
        {question.required && (
          <span className="text-red-500 text-sm">*</span>
        )}
        {statistics && statistics.totalResponses > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {statistics.totalResponses} 人已答
          </Badge>
        )}
      </Label>
      {question.description && (
        <p className="text-sm text-muted-foreground mt-1">
          {question.description}
        </p>
      )}
    </div>
  );

  // 渲染错误信息
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  };

  // 渲染统计信息
  const renderStatistics = () => {
    if (!showStatistics || !statistics || statistics.totalResponses === 0) {
      return null;
    }

    return (
      <div className="statistics-panel mt-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">其他人的选择</span>
            <Badge variant="outline" className="text-xs">
              {statistics.totalResponses} 人参与
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStatsDetails(!showStatsDetails)}
          >
            {showStatsDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {showStatsDetails && (
          <StatisticsChart
            statistics={statistics}
            questionType={question.type}
            currentValue={value}
            compact={true}
          />
        )}

        {!showStatsDetails && statistics.optionStats && (
          <div className="space-y-2">
            {statistics.optionStats.slice(0, 3).map((option) => (
              <div key={option.value} className="flex items-center justify-between">
                <span className="text-sm truncate flex-1">{option.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        option.isSelected ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {Math.round(option.percentage)}%
                  </span>
                </div>
              </div>
            ))}
            {statistics.optionStats.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                还有 {statistics.optionStats.length - 3} 个选项...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 根据问题类型渲染输入组件
  const renderInput = () => {
    switch (question.type) {
      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={handleChange}
            disabled={disabled}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                <Label 
                  htmlFor={`${question.id}-${option.value}`}
                  className="flex-1 cursor-pointer"
                >
                  {option.label}
                  {option.description && (
                    <span className="block text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </Label>
                {statistics?.optionStats?.find(s => s.value === option.value) && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(statistics.optionStats.find(s => s.value === option.value)?.percentage || 0)}%
                  </Badge>
                )}
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option.value}`}
                  checked={checkboxValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkboxValues, option.value]
                      : checkboxValues.filter(v => v !== option.value);
                    handleChange(newValues);
                  }}
                  disabled={disabled}
                />
                <Label 
                  htmlFor={`${question.id}-${option.value}`}
                  className="flex-1 cursor-pointer"
                >
                  {option.label}
                  {option.description && (
                    <span className="block text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </Label>
                {statistics?.optionStats?.find(s => s.value === option.value) && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(statistics.optionStats.find(s => s.value === option.value)?.percentage || 0)}%
                  </Badge>
                )}
              </div>
            ))}
          </div>
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={question.placeholder || '请选择...'} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {statistics?.optionStats?.find(s => s.value === option.value) && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {Math.round(statistics.optionStats.find(s => s.value === option.value)?.percentage || 0)}%
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'text':
      case 'email':
        return (
          <Input
            type={question.type === 'email' ? 'email' : 'text'}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={question.placeholder}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
            maxLength={question.config?.maxLength}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={question.placeholder}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
            rows={question.config?.rows || 4}
            maxLength={question.config?.maxLength}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(Number(e.target.value))}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={question.placeholder}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
            min={question.config?.min}
            max={question.config?.max}
            step={question.config?.step}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
            min={question.config?.minDate}
            max={question.config?.maxDate}
          />
        );

      case 'rating':
        const maxRating = question.config?.maxRating || 5;
        const currentRating = value || 0;
        
        return (
          <div className="flex items-center space-x-1">
            {Array.from({ length: maxRating }, (_, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={() => handleChange(index + 1)}
                disabled={disabled}
              >
                <Star
                  className={`h-6 w-6 ${
                    index < currentRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </Button>
            ))}
            {currentRating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {currentRating} / {maxRating}
              </span>
            )}
          </div>
        );

      case 'slider':
        const min = question.config?.min || 0;
        const max = question.config?.max || 100;
        const step = question.config?.step || 1;
        
        return (
          <div className="space-y-4">
            <Slider
              value={[value || min]}
              onValueChange={(values) => handleChange(values[0])}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{min}</span>
              <span className="font-medium">{value || min}</span>
              <span>{max}</span>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                点击选择文件或拖拽文件到此处
              </p>
              <Input
                type="file"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    handleChange(question.config?.multiple ? Array.from(files) : files[0]);
                  }
                }}
                accept={question.config?.accept}
                multiple={question.config?.multiple}
                disabled={disabled}
                className="hidden"
                id={`file-${question.id}`}
              />
              <Label
                htmlFor={`file-${question.id}`}
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                选择文件
              </Label>
            </div>
            
            {value && (
              <div className="text-sm text-muted-foreground">
                {Array.isArray(value) 
                  ? `已选择 ${value.length} 个文件`
                  : `已选择: ${value.name}`
                }
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
            不支持的问题类型: {question.type}
          </div>
        );
    }
  };

  return (
    <Card className={`question-renderer ${className} ${isFocused ? 'ring-2 ring-primary/20' : ''}`}>
      <CardContent className="p-6">
        {renderQuestionTitle()}
        
        <div className="question-input">
          {renderInput()}
        </div>
        
        {renderError()}
        {renderStatistics()}
        
        {/* 字符计数 */}
        {(question.type === 'text' || question.type === 'textarea') && 
         question.config?.maxLength && 
         typeof value === 'string' && (
          <div className="text-xs text-muted-foreground text-right mt-2">
            {value.length} / {question.config.maxLength}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
