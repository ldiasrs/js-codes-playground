'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTopics } from '../../hooks/useTopics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { TopicData } from '../../services/topics/types';

interface TopicFormData {
  subject: string;
}

export default function TopicsPage() {
  const { isAuthenticated, user, isLoading: authLoading, logout } = useAuth();
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
    if (!authLoading && !isAuthenticated) {
      router.push('/lending');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadTopics();
    }
  }, [isAuthenticated, user]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to lending page
  }

  return (
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Topic
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Create Topic Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Create New Topic</h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <Input
                type="text"
                label="Topic Subject"
                placeholder="Enter topic subject"
                value={formData.subject}
                onChange={(value) => setFormData({ subject: value })}
                required
                disabled={submitting}
                maxLength={255}
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
          <Card className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Edit Topic</h3>
            <form onSubmit={handleUpdateTopic} className="space-y-4">
              <Input
                type="text"
                label="Topic Subject"
                placeholder="Enter topic subject"
                value={formData.subject}
                onChange={(value) => setFormData({ subject: value })}
                required
                disabled={submitting}
                maxLength={255}
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

        {/* Topics List */}
        {loading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading topics...</p>
          </div>
        ) : topics.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No topics yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first topic to start your learning journey.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Your First Topic
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {topics.map((topic) => (
              <Card key={topic.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      {topic.subject}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {formatDate(topic.dateCreated)}
                    </p>
                    {topic.history && topic.history.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {topic.history.length} history entries
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(topic)}
                      disabled={submitting}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTopic(topic.id)}
                      disabled={submitting}
                      className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 