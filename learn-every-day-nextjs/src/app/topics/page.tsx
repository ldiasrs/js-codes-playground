'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTopics } from '../../hooks/useTopics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AuthGuard } from '../../components/auth/AuthGuard';
import type { TopicData } from '../../services/topics/types';

interface TopicFormData {
  subject: string;
}

export default function TopicsPage() {
  const { user, logout } = useAuth();
  const { 
    topics, 
    loading, 
    error, 
    getAllTopics, 
    createTopic, 
    updateTopic, 
    deleteTopic,
    clearError 
  } = useTopics();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicData | null>(null);
  const [formData, setFormData] = useState<TopicFormData>({ subject: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadTopics();
    }
  }, [user]);

  const loadTopics = async () => {
    if (user) {
      await getAllTopics({ customerId: user.id });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/lending');
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !user) return;

    try {
      setSubmitting(true);
      clearError();
      
      const result = await createTopic({
        customerId: user.id,
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

  const startEdit = (topic: TopicData) => {
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

  return (
    <AuthGuard requireAuth={true} redirectTo="/lending">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card shadow-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Topic Management
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.name || user?.email}
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
                Manage your learning topics and track your progress.
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
                <Input
                  type="text"
                  label="Topic Subject"
                  placeholder="Enter topic subject"
                  value={formData.subject}
                  onChange={(value) => setFormData({ subject: value })}
                  required
                  disabled={submitting}
                />
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
                <Input
                  type="text"
                  label="Topic Subject"
                  placeholder="Enter topic subject"
                  value={formData.subject}
                  onChange={(value) => setFormData({ subject: value })}
                  required
                  disabled={submitting}
                />
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
                <Card key={topic.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                      {topic.subject}
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(topic)}
                        disabled={submitting}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
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