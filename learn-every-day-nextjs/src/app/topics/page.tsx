'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTopics } from '../../hooks/useTopics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AuthGuard } from '../../components/auth/AuthGuard';
import type { TopicData, TopicHistoryData } from '../../services/topics/types';

interface TopicFormData {
  subject: string;
}

const PROMPT_EXAMPLES = [
  {
    category: "🧠 Desenvolvimento Pessoal e Produtividade",
    examples: [
      "Desenvolver um sistema completo de gestão do tempo que inclua técnicas de organização, priorização de tarefas e estratégias para eliminar distrações e aumentar a produtividade diária.",
      "Criar um guia prático para desenvolver inteligência emocional, incluindo técnicas de autoconhecimento, controle emocional e habilidades de relacionamento interpessoal.",
      "Estabelecer uma rotina de mindfulness e meditação que combine técnicas de respiração, meditação guiada e práticas de atenção plena para reduzir o estresse e melhorar o foco.",
      "Construir um sistema de hábitos saudáveis que inclua rotinas matinais, exercícios físicos regulares, alimentação balanceada e técnicas de recuperação mental.",
      "Desenvolver resiliência mental e foco através de estratégias de superação de adversidades, técnicas de concentração e métodos para manter a motivação em longo prazo."
    ]
  },
  {
    category: "💼 Carreira e Habilidades Profissionais",
    examples: [
      "Aperfeiçoar habilidades de comunicação eficaz, incluindo técnicas de oratória, escrita profissional, escuta ativa e comunicação não-verbal para diferentes contextos empresariais.",
      "Desenvolver competências de liderança e gestão de equipes, abordando estilos de liderança, técnicas de motivação, resolução de conflitos e desenvolvimento de talentos.",
      "Dominar técnicas de negociação e persuasão, incluindo estratégias de argumentação, leitura de linguagem corporal e criação de acordos win-win em diferentes cenários.",
      "Fortalecer o pensamento crítico e habilidades de resolução de problemas através de metodologias estruturadas, análise de dados e tomada de decisões baseada em evidências.",
      "Aprender e aplicar Design Thinking como metodologia de inovação, incluindo técnicas de empatia, definição de problemas, ideação, prototipagem e teste de soluções."
    ]
  },
  {
    category: "🌍 Idiomas",
    examples: [
      "Desenvolver fluência em inglês através de um programa estruturado que inclua gramática avançada, vocabulário especializado, conversação prática e compreensão cultural para contextos profissionais e pessoais.",
      "Aprender espanhol de forma progressiva, focando em conversação cotidiana, gramática essencial, expressões idiomáticas e diferenças culturais dos países hispanofalantes.",
      "Dominar o francês através de um método que combine estudo da gramática, prática de pronúncia, vocabulário contextualizado e imersão cultural na francofonia.",
      "Adquirir competência em alemão, incluindo estruturas gramaticais complexas, vocabulário técnico, compreensão auditiva e expressão escrita para contextos acadêmicos e profissionais."
    ]
  }
];

export default function TopicsPage() {
  const { customerId, logout } = useAuth();
  const { 
    topics, 
    loading, 
    error, 
    getAllTopics, 
    createTopic, 
    updateTopic, 
    closeTopic,
    deleteTopic,
    getTopicHistories,
    clearError 
  } = useTopics();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicData | null>(null);
  const [formData, setFormData] = useState<TopicFormData>({ subject: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [viewingHistories, setViewingHistories] = useState<TopicData | null>(null);
  const [topicHistories, setTopicHistories] = useState<TopicHistoryData[]>([]);
  const [loadingHistories, setLoadingHistories] = useState(false);
  const [showInfoCard, setShowInfoCard] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadTopics();
    }
  }, [customerId]);

  const loadTopics = async () => {
    if (customerId) {
      await getAllTopics({ customerId: customerId });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/lending');
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !customerId) return;

    try {
      setSubmitting(true);
      clearError();
      
      const result = await createTopic({
        customerId: customerId,
        subject: formData.subject.trim()
      });
      
      if (result) {
        setFormData({ subject: '' });
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error('Error creating topic:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !formData.subject.trim()) return;

    try {
      setSubmitting(true);
      clearError();
      
      const result = await updateTopic({
        id: editingTopic.id,
        subject: formData.subject.trim()
      });
      
      if (result) {
        setFormData({ subject: '' });
        setEditingTopic(null);
      }
    } catch (err) {
      console.error('Error updating topic:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return;
    }

    try {
      setSubmitting(true);
      clearError();
      
      await deleteTopic({ id: topicId });
    } catch (err) {
      console.error('Error deleting topic:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to close this topic? Closed topics cannot be reopened.')) {
      return;
    }

    try {
      setSubmitting(true);
      clearError();
      
      await closeTopic({ id: topicId });
    } catch (err) {
      console.error('Error closing topic:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (topic: TopicData) => {
    // Don't allow editing closed topics
    if (topic.closed) {
      return;
    }
    setEditingTopic(topic);
    setFormData({ subject: topic.subject });
  };

  const cancelEdit = () => {
    setEditingTopic(null);
    setFormData({ subject: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExampleClick = (example: string) => {
    setFormData({ subject: example });
    setShowExamples(false);
  };

  const handleViewTopicHistories = async (topic: TopicData) => {
    try {
      setLoadingHistories(true);
      setViewingHistories(topic);
      
      const histories = await getTopicHistories({ topicId: topic.id });
      setTopicHistories(histories);
    } catch (err) {
      console.error('Error fetching topic histories:', err);
    } finally {
      setLoadingHistories(false);
    }
  };

  const handleCloseHistories = () => {
    setViewingHistories(null);
    setTopicHistories([]);
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card shadow-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo2.png" 
                  alt="Logo" 
                  className="w-8 h-8 object-contain"
                />
                <h1 className="text-xl font-semibold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  LED - Learn Every Day
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome back!
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Your Topics
              </h2>
              <p className="text-muted-foreground">
                Add topics of interest to start your personalized learning journey and receive daily educational content.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              disabled={submitting}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Topic
            </Button>
          </div>

          {/* Information Card */}
          <Card className="mb-6 bg-muted/30 border-border">
            <button
              onClick={() => setShowInfoCard(!showInfoCard)}
              className="w-full p-4 text-left hover:bg-muted/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      How Topic Management Works
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Learn about limits and automatic closure
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg 
                    className={`w-4 h-4 text-muted-foreground transform transition-transform duration-200 ${showInfoCard ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>
            
            {showInfoCard && (
              <div className="px-4 pb-4">
                <div className="space-y-2 text-xs text-foreground">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>
                      <strong>Daily Email Updates:</strong> New topic histories will be sent to your email daily, considering all previous history to provide comprehensive learning content.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>
                      <strong>Automatic Closure &amp; Email Backup:</strong> Topics will be automatically closed after reaching the limit of learning histories. All content is safely backed up in your email, so you can delete old topics while keeping the valuable information.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>
                      <strong>Topic Limits &amp; Upgrade Options:</strong> There&apos;s a maximum number of active topics you can have. If you need more topics, simply delete older ones you no longer need or upgrade to a higher tier for expanded capabilities.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Create Topic Form */}
          {showCreateForm && (
            <Card className="mb-8 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Create New Topic</h3>
              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Learning Prompt
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical min-h-[120px]"
                    placeholder="Describe what you want to learn in detail. Be specific about your goals, interests, and the depth of knowledge you're seeking..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ subject: e.target.value })}
                    required
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Write a detailed prompt describing what you want to learn. The more specific you are, the better your learning experience will be.
                  </p>
                </div>
                
                {/* Examples Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Need inspiration? Check out these examples:</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExamples(!showExamples)}
                      className="text-primary hover:text-primary/80"
                    >
                      {showExamples ? 'Hide Examples' : 'Show Examples'}
                    </Button>
                  </div>
                  
                  {showExamples && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                      {PROMPT_EXAMPLES.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="space-y-2">
                          <h5 className="text-sm font-semibold text-foreground">{category.category}</h5>
                          <div className="space-y-2">
                            {category.examples.map((example, exampleIndex) => (
                              <button
                                key={exampleIndex}
                                type="button"
                                onClick={() => handleExampleClick(example)}
                                className="block w-full text-left p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors duration-200 border border-transparent hover:border-border"
                              >
                                {example}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={submitting}
                  >
                    Create Topic
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Edit Topic Form */}
          {editingTopic && (
            <Card className="mb-8 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Edit Topic</h3>
              <form onSubmit={handleUpdateTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Learning Prompt
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical min-h-[120px]"
                    placeholder="Describe what you want to learn in detail..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ subject: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={submitting}
                  >
                    Update Topic
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Topic Histories Modal */}
          {viewingHistories && (
            <Card className="mb-8 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Topic Histories - {viewingHistories.subject}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseHistories}
                  disabled={loadingHistories}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </Button>
              </div>

              {loadingHistories && (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" className="mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading topic histories...</p>
                </div>
              )}

              {!loadingHistories && topicHistories.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">No histories yet</h4>
                  <p className="text-muted-foreground">
                    This topic hasn&apos;t generated any histories yet. Check back later.
                  </p>
                </div>
              )}

              {!loadingHistories && topicHistories.length > 0 && (
                <div className="space-y-4">
                  {topicHistories.map((history, index) => (
                    <div key={history.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            #{index + 1}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(history.dateCreated).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div className="text-foreground whitespace-pre-wrap">
                          {history.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-muted-foreground">Loading topics...</p>
            </div>
          )}

          {/* Topics List */}
          {!loading && topics.length === 0 && (
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No topics yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your learning journey by creating your first topic.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Your First Topic
              </Button>
            </Card>
          )}

          {/* Topics Grid */}
          {!loading && topics.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <Card key={topic.id} className={`p-6 hover:shadow-lg transition-shadow duration-200 ${topic.closed ? 'bg-muted/50 opacity-75' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold line-clamp-3 ${topic.closed ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {topic.subject}
                      </h3>
                      {topic.closed && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Closed
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTopicHistories(topic)}
                        disabled={submitting}
                        className="text-blue-600 hover:text-blue-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(topic)}
                        disabled={submitting || topic.closed}
                        className={topic.closed ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      {!topic.closed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCloseTopic(topic.id)}
                          disabled={submitting}
                          className="text-orange-600 hover:text-orange-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTopic(topic.id)}
                        disabled={submitting}
                        className="text-destructive hover:text-destructive"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(topic.dateCreated)}
                  </div>
                  {topic.dateUpdated !== topic.dateCreated && (
                    <div className="text-sm text-muted-foreground">
                      Updated: {formatDate(topic.dateUpdated)}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
} 