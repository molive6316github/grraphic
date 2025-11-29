import React, { useEffect, useState } from 'react';
import { MessageSquare, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  message_role: 'user' | 'assistant';
  message_content: string;
  created_at: string;
}

interface ChatSession {
  session_id: string;
  user_email: string;
  message_count: number;
  first_message: string;
  last_activity: string;
  messages: ChatMessage[];
}

export function AdminGradiChats() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    try {
      setLoading(true);

      const { data: messages, error } = await supabase
        .from('gradi_chat_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails separately
      const userIds = [...new Set(messages?.map(msg => msg.user_id).filter(Boolean))];
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);

      const sessionMap = new Map<string, ChatSession>();

      messages?.forEach(msg => {
        const userEmail = userEmailMap.get(msg.user_id) || 'Unknown';

        const formattedMsg: ChatMessage = {
          ...msg,
          user_email: userEmail
        };

        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            session_id: msg.session_id,
            user_email: userEmail,
            message_count: 0,
            first_message: msg.message_role === 'user' ? msg.message_content : '',
            last_activity: msg.created_at,
            messages: []
          });
        }

        const session = sessionMap.get(msg.session_id)!;
        session.messages.push(formattedMsg);
        session.message_count++;

        if (msg.message_role === 'user' && !session.first_message) {
          session.first_message = msg.message_content;
        }
      });

      const sessionsArray = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());

      sessionsArray.forEach(session => {
        session.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });

      setSessions(sessionsArray);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Gradi chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3">
          <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">Total Chat Sessions</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{sessions.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gradi Chat Sessions</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No chat sessions found
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.session_id} className="p-4">
                <div
                  className="flex items-start justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors"
                  onClick={() => setExpandedSession(
                    expandedSession === session.session_id ? null : session.session_id
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.first_message.substring(0, 60)}
                        {session.first_message.length > 60 ? '...' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <User size={12} className="mr-1" />
                        {session.user_email}
                      </span>
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {new Date(session.last_activity).toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {session.message_count} messages
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {expandedSession === session.session_id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedSession === session.session_id && (
                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                    {session.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.message_role === 'user'
                            ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                            : 'bg-gray-50 dark:bg-gray-700/50 mr-8'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-semibold ${
                            message.message_role === 'user'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-purple-600 dark:text-purple-400'
                          }`}>
                            {message.message_role === 'user' ? 'User' : 'Gradi'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {message.message_content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
