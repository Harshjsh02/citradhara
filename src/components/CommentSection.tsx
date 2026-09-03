"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ThumbsUp, Trash2, Send } from "lucide-react";
import { Comment } from "@/types";
import { fetchComments, addComment } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

interface CommentSectionProps {
  videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const { user, signInWithGoogle } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchComments(videoId);
      setComments(data);
      setLoading(false);
    }
    load();
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!user) {
      await signInWithGoogle();
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addComment(videoId, {
        videoId,
        userId: user.uid,
        userName: user.displayName || "CodersHigh Member",
        userAvatar: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        text: newCommentText.trim(),
      });
      setComments([created, ...comments]);
      setNewCommentText("");
    } catch (err) {
      console.error("Error submitting comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-400" />
          <span>{comments.length} Comments</span>
        </h3>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="flex items-start gap-3">
        {/* User avatar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
          alt="User"
          className="h-9 w-9 rounded-full object-cover border border-[#272a3b] shrink-0"
        />

        <div className="flex-1 space-y-2">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={user ? "Add a comment to this wonder..." : "Sign in with Google to share your thoughts..."}
            rows={2}
            className="w-full rounded-xl border border-[#242738] bg-[#12131d] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition resize-none"
          />

          <div className="flex justify-end gap-2">
            {newCommentText.trim() && (
              <button
                type="button"
                onClick={() => setNewCommentText("")}
                className="rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={!newCommentText.trim() || isSubmitting}
              className="flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-1.5 text-xs font-bold text-black shadow-md shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Posting..." : "Comment"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="py-6 text-center text-xs text-zinc-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-[#1f2230] bg-[#10121a] p-6 text-center text-xs text-zinc-500">
            No comments yet. Be the first to share your thoughts on this wonder!
          </div>
        ) : (
          comments.map((comment) => {
            let timeAgo = "recently";
            try {
              timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
            } catch {
              timeAgo = "recently";
            }

            return (
              <div key={comment.id} className="flex gap-3 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                  className="h-8 w-8 rounded-full object-cover border border-[#272a3b] shrink-0"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">
                      {comment.userName}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {timeAgo}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {comment.text}
                  </p>

                  <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-400">
                    <button className="flex items-center gap-1 hover:text-amber-400 transition">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{comment.likes || ""}</span>
                    </button>
                    <button className="hover:text-zinc-200 transition font-medium">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
