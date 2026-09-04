"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ThumbsUp, Send, ExternalLink, Play, Sparkles } from "lucide-react";
import { Comment } from "@/types";
import { fetchComments, addComment } from "@/lib/db";
import { fetchYouTubeComments, YouTubeCommentItem } from "@/lib/youtubeApi";
import { useAuth } from "@/context/AuthContext";

interface CommentSectionProps {
  videoId: string;
  isYouTube?: boolean;
  youtubeVideoId?: string;
}

export default function CommentSection({
  videoId,
  isYouTube = false,
  youtubeVideoId,
}: CommentSectionProps) {
  const { user, signInWithGoogle, googleAccessToken } = useAuth();
  
  // Tab state: if YouTube, default to "youtube" tab
  const [activeTab, setActiveTab] = useState<"youtube" | "citradhara">(
    isYouTube ? "youtube" : "citradhara"
  );

  // Citradhara Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  // YouTube Comments state
  const [ytComments, setYtComments] = useState<YouTubeCommentItem[]>([]);
  const [loadingYt, setLoadingYt] = useState(false);
  const [ytLoaded, setYtLoaded] = useState(false);

  const effectiveYtId = youtubeVideoId || (isYouTube ? videoId : "");

  // Load Citradhara comments
  useEffect(() => {
    async function loadCitraComments() {
      setLoadingComments(true);
      const data = await fetchComments(videoId);
      setComments(data);
      setLoadingComments(false);
    }
    loadCitraComments();
  }, [videoId]);

  // Load YouTube comments if it's a YouTube video
  useEffect(() => {
    if (!isYouTube || !effectiveYtId) return;

    async function loadYt() {
      setLoadingYt(true);
      const fetched = await fetchYouTubeComments(effectiveYtId, googleAccessToken);
      setYtComments(fetched);
      setYtLoaded(true);
      setLoadingYt(false);
    }

    loadYt();
  }, [isYouTube, effectiveYtId, googleAccessToken]);

  const handleSubmitCitradhara = async (e: React.FormEvent) => {
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
        userName: user.displayName || "Citradhara Member",
        userAvatar:
          user.photoURL ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
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

  const directYtUrl = effectiveYtId ? `https://www.youtube.com/watch?v=${effectiveYtId}` : null;

  return (
    <div className="mt-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c1c26] pb-3">
        {isYouTube ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("youtube")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === "youtube"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-[#141624]"
              }`}
            >
              <Play className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              <span>YouTube Comments</span>
              {ytComments.length > 0 && (
                <span className="rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] text-red-300 font-bold">
                  {ytComments.length}+
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("citradhara")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === "citradhara"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-[#141624]"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
              <span>Citradhara Discussion</span>
              {comments.length > 0 && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300 font-bold">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
        ) : (
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-400" />
            <span>{comments.length} Comments</span>
          </h3>
        )}

        {directYtUrl && (
          <a
            href={directYtUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on YouTube to reply directly"
            className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-amber-400 transition"
          >
            <span>Comment on YouTube</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* TAB 1: YouTube Comments */}
      {isYouTube && activeTab === "youtube" && (
        <div className="space-y-4">
          {/* Informative info banner */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-400 shrink-0" />
              <span>
                Showing real-time public comments from <strong>YouTube</strong>. To add your reply to YouTube directly, open on YouTube.
              </span>
            </div>
            {directYtUrl && (
              <a
                href={directYtUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-red-500/20 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/30 transition border border-red-500/30"
              >
                Open YouTube ↗
              </a>
            )}
          </div>

          {/* YouTube Comments list */}
          {loadingYt ? (
            <div className="py-12 text-center text-xs text-zinc-400 space-y-2">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <div>Loading top YouTube comments...</div>
            </div>
          ) : ytComments.length > 0 ? (
            <div className="space-y-4 pt-1">
              {ytComments.map((comment) => {
                let timeAgo = "recently";
                try {
                  timeAgo = formatDistanceToNow(new Date(comment.publishedAt), { addSuffix: true });
                } catch {
                  timeAgo = "recently";
                }

                return (
                  <div key={comment.id} className="flex gap-3 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName}
                      className="h-8 w-8 rounded-full object-cover border border-[#272a3b] shrink-0"
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {comment.authorChannelUrl ? (
                          <a
                            href={comment.authorChannelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-zinc-200 hover:text-amber-400 transition"
                          >
                            {comment.authorName}
                          </a>
                        ) : (
                          <span className="text-xs font-semibold text-zinc-200">
                            {comment.authorName}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-500">{timeAgo}</span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                        {comment.text}
                      </p>

                      <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <ThumbsUp className="h-3 w-3 text-zinc-500" />
                          <span>{comment.likeCount > 0 ? comment.likeCount.toLocaleString() : ""}</span>
                        </div>

                        {comment.replyCount > 0 && (
                          <span className="text-zinc-500 font-medium">
                            {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                          </span>
                        )}

                        {directYtUrl && (
                          <a
                            href={directYtUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:underline text-[10px]"
                          >
                            Reply on YouTube
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-[#1f2230] bg-[#10121a] p-6 text-center text-xs text-zinc-400 space-y-3">
              <p>
                {ytLoaded 
                  ? "No YouTube comments found or comments are disabled for this video." 
                  : "Connect with Google to view live YouTube comments, or read them directly on YouTube."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {directYtUrl && (
                  <a
                    href={directYtUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition"
                  >
                    <span>View on YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  onClick={() => setActiveTab("citradhara")}
                  className="rounded-lg bg-[#1a1a24] px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
                >
                  Switch to Citradhara Discussion
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Citradhara Discussion (or default when not YouTube) */}
      {(!isYouTube || activeTab === "citradhara") && (
        <div className="space-y-6">
          {/* Input box */}
          <form onSubmit={handleSubmitCitradhara} className="flex items-start gap-3">
            {/* User avatar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                user?.photoURL ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
              }
              alt="User"
              className="h-9 w-9 rounded-full object-cover border border-[#272a3b] shrink-0"
            />

            <div className="flex-1 space-y-2">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={
                  user
                    ? "Add a comment to this wonder..."
                    : "Sign in with Google to share your thoughts..."
                }
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
            {loadingComments ? (
              <div className="py-6 text-center text-xs text-zinc-500">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="rounded-xl border border-[#1f2230] bg-[#10121a] p-6 text-center text-xs text-zinc-500">
                No Citradhara community comments yet. Be the first to share your thoughts!
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
                        <span className="text-[11px] text-zinc-500">{timeAgo}</span>
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
      )}
    </div>
  );
}

