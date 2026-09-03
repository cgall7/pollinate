import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { HoneycombStore } from '../services/HoneycombStore';
import { PressableScale } from './PressableScale';
import { BeeTransition } from './BeeTransition';
import { Avatar } from './Avatar';
import { PaperBlock, paperInk } from './PaperBlock';

const formatDate = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// One shared gratitude entry in the Honeycomb feed: author, date, the text
// itself, then like + comment underneath — same shape as the Venmo-style
// public-transaction feel Colin described.
export const FeedCard = ({ share, onLikeToggled }) => {
  const [liking, setLiking] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(share.commentCount);
  const [postingComment, setPostingComment] = useState(false);
  const [likeFlightKey, setLikeFlightKey] = useState(0);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    const wasLiked = share.likedByMe;
    try {
      await HoneycombStore.toggleLike(share.id, share.likedByMe);
      if (!wasLiked) setLikeFlightKey((key) => key + 1);
      onLikeToggled(share.id);
    } catch (err) {
      console.warn('Failed to toggle like', err);
    } finally {
      setLiking(false);
    }
  };

  const toggleComments = async () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && comments.length === 0) {
      setLoadingComments(true);
      try {
        setComments(await HoneycombStore.listComments(share.id));
      } catch (err) {
        console.warn('Failed to load comments', err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handlePostComment = async () => {
    const content = commentText.trim();
    if (!content || postingComment) return;
    setPostingComment(true);
    try {
      await HoneycombStore.addComment(share.id, content);
      setComments(await HoneycombStore.listComments(share.id));
      setCommentCount((count) => count + 1);
      setCommentText('');
    } catch (err) {
      console.warn('Failed to post comment', err);
    } finally {
      setPostingComment(false);
    }
  };

  // §18.1.1: demo shares are keepsakes — readable, never interactive.
  // Dropping the actions row (their counts are zeroed by construction) is
  // what keeps a tap from firing toggleLike('demo-N') at Supabase.
  //
  // §23.9.1 — A LABEL RETIRES THE REGISTER. The paler content used to be the
  // week-list twin of the grid's paler demo cells; it is gone. A dim is a
  // WHISPER that a card is not real and this label SAYS SO, and once you have
  // the label the dim is actively harmful — it spends legibility to
  // communicate something already said in words. The comb keeps its `0.45`
  // (Lumen, 2026-08-25: a label retires a register only when it SHARES THE
  // REGISTER'S SCOPE — co-located with the object and present in every state
  // the register covers; a seat's initials are furniture, and this card is
  // testimony). The label is on the AUTHOR, because it is the person who is
  // fictional, not the sentence.
  const isDemo = share.isDemo ?? false;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar
          name={share.isOwn ? 'You' : share.author?.display_name ?? 'Someone'}
          avatarUrl={share.author?.avatar_url}
          size={36}
        />
        <View style={styles.headerText}>
          <View style={styles.authorRow}>
            <Text style={styles.author}>{share.isOwn ? 'You' : share.author?.display_name ?? 'Someone'}</Text>
            {isDemo && <Text style={styles.sampleLabel}>SAMPLE</Text>}
          </View>
          <Text style={styles.date}>{formatDate(share.entryDate)}</Text>
        </View>
      </View>
      <PaperBlock paper={share.paper} style={styles.contentBlock}>
        <Text style={[styles.content, { color: paperInk(share.paper) }]}>"{share.content}"</Text>
      </PaperBlock>

      {!isDemo && (
      <View style={styles.actionsRow}>
        <PressableScale onPress={handleLike} disabled={liking} style={styles.actionButton}>
          <Ionicons
            name={share.likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={share.likedByMe ? theme.colors.accent : theme.colors.textSecondary}
          />
          {share.likeCount > 0 && <Text style={styles.actionText}>{share.likeCount}</Text>}
          <BeeTransition triggerKey={likeFlightKey} role="like-lift" anchorStyle={styles.likeBeeAnchor} size={13} />
        </PressableScale>

        <PressableScale onPress={toggleComments} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={17} color={theme.colors.textSecondary} />
          {commentCount > 0 && <Text style={styles.actionText}>{commentCount}</Text>}
        </PressableScale>
      </View>
      )}

      {commentsOpen && (
        <View style={styles.commentsSection}>
          {loadingComments ? (
            <ActivityIndicator color={theme.colors.accent} />
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <Text style={styles.commentAuthor}>{comment.author?.display_name ?? 'Someone'}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
              </View>
            ))
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Say something kind."
              placeholderTextColor={theme.colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              editable={!postingComment}
              maxLength={2000}
            />
            <PressableScale onPress={handlePostComment} disabled={!commentText.trim() || postingComment}>
              <Ionicons name="arrow-up-circle" size={30} color={theme.colors.ink} />
            </PressableScale>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  // The author line is a row so the §23.9.1 label sits beside the name it
  // qualifies. `flexShrink` on the name and not on the label is what keeps a
  // long display name from pushing SAMPLE off the card — the name wraps, the
  // label stays.
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  author: {
    ...theme.type.bodySm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  // §23.9.1's label: the existing eyebrow register, which is what the app
  // already uses to mark a thing's CATEGORY rather than its content, in
  // `inkSoft` on the card's own `surface` — 6.31:1, and it clears 4.5:1 only
  // BECAUSE the card is no longer dimmed. Under the deleted 0.7 the same
  // token rendered 3.22:1 on the `date` node beneath it, which is the live
  // WCAG failure this commit repairs (bodySm is 14px, so the 3:1 large-scale
  // path was never available).
  sampleLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    flexShrink: 0,
  },
  date: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
  },
  contentBlock: {
    marginBottom: 14,
  },
  content: {
    fontFamily: theme.fonts.bodyItalic,
    fontSize: 18,
    lineHeight: 26,
    color: theme.colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
  },
  likeBeeAnchor: {
    top: 0,
    left: 0,
  },
  commentsSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    gap: 10,
  },
  commentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  commentAuthor: {
    ...theme.type.bodySm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textPrimary,
  },
  commentText: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
    flexShrink: 1,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.washYellow,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
