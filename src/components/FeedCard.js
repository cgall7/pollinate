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
export const FeedCard = ({ share, onShareChanged }) => {
  const [liking, setLiking] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  // R-FC-3/R-FC-4: has `comments` ever been READ, as distinct from being empty.
  // `comments.length === 0` conflates "no comment exists" with "the read never
  // landed", and the two want opposite renders — a caption of nothing, versus
  // no caption at all. This flag does NOT gate the fetch; R-FC-4's re-fetch on
  // every open is guarded by `loadingComments` and by nothing else.
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [likeFlightKey, setLikeFlightKey] = useState(0);
  // DES-44 R-FC-1. The like is a local act with a remote record, so its control
  // renders local state. `pendingLike` is an OVERRIDE, never a copy: null means
  // the prop is the truth, and any other value is a claim this card is making
  // until the prop catches up with it. It is cleared during render rather than
  // in an effect, which keeps `FeedCard` at zero effects.
  const [pendingLike, setPendingLike] = useState(null);

  // The prop agreeing with the claim is what retires the claim, so the clear is
  // a render-phase update on this same component. React re-renders before
  // committing and `pendingLike` is null on that pass, so it settles at once.
  if (pendingLike !== null && pendingLike === share.likedByMe) setPendingLike(null);

  const liked = pendingLike ?? share.likedByMe;
  // R-FC-1: one pending across glyph, ink AND count. `:120`'s render condition
  // is `> 0`, so the pending decides whether the number EXISTS at tap time;
  // without this the control changes width under the thumb that pressed it, one
  // round trip late. The delta is zero whenever the override is absent or has
  // already been overtaken, so the settled state is exactly the prop.
  //
  // Not clamped, because it cannot go negative: the -1 arm needs
  // `share.likedByMe` true, and `toFeedShare` derives BOTH fields from the same
  // array — `likeCount: share.likes?.length ?? 0` (`HoneycombStore.js:59`) and
  // `likedByMe: (share.likes ?? []).some(...)` (`:60`) — so a true `likedByMe`
  // is a member of the array whose length is the count, and the count is >= 1.
  // A clamp here would hide the day those two stop being one read.
  const likeCount = share.likeCount + (liked === share.likedByMe ? 0 : liked ? 1 : -1);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    // `wasLiked` reads the OVERRIDE, not the prop. That is what makes the second
    // tap inside one refresh take toggleLike's delete branch instead of a second
    // insert against `unique_like`, so the 23505 arm goes unreachable by this
    // route rather than merely quieter.
    const wasLiked = liked;
    // The override in force when this tap landed. Row 2 of the acceptance is
    // "the heart returns to its PRE-TAP state", and pre-tap is this value, not
    // the prop: a second tap inside one refresh window is made against a claim
    // the prop has not caught up with yet, so clearing to null there would
    // withdraw a claim the previous write DID support.
    const priorClaim = pendingLike;
    setPendingLike(!wasLiked);
    try {
      await HoneycombStore.toggleLike(share.id, wasLiked);
      // R-FC-2: the finger lights the glyph, the write lights the bee. A filled
      // heart is a claim and a claim can be withdrawn; motion cannot, so the
      // flight stays behind the returned write.
      if (!wasLiked) setLikeFlightKey((key) => key + 1);
      onShareChanged(share.id);
    } catch (err) {
      // The claim the write did not support is withdrawn.
      setPendingLike(priorClaim);
      console.warn('Failed to toggle like', err);
    } finally {
      setLiking(false);
    }
  };

  // R-FC-4. Opening the sheet IS the request for a fresh read, so every open
  // re-fetches. The old condition cached on `comments.length === 0`, which meant
  // a share with zero comments re-read on every open and a share with ANY
  // comments never re-read for the life of the mount; the caching half is the
  // one that bites. `loadingComments` guards a CONCURRENT fetch and never a
  // repeated one, and the previous list stays on screen while it runs, so
  // nothing blanks. It also bounds the closed-state `max` below to one open.
  const toggleComments = async () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (!opening || loadingComments) return;
    setLoadingComments(true);
    try {
      setComments(await HoneycombStore.listComments(share.id));
      setCommentsLoaded(true);
    } catch (err) {
      console.warn('Failed to load comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    const content = commentText.trim();
    if (!content || postingComment) return;
    setPostingComment(true);
    try {
      await HoneycombStore.addComment(share.id, content);
      setComments(await HoneycombStore.listComments(share.id));
      setCommentsLoaded(true);
      setCommentText('');
      // R-FC-5: a posted comment reached `comments` and never reached the prop,
      // so the parent was told about a like and never about a comment. The
      // callback now carries both causes, which is why it is no longer named
      // for one of them.
      onShareChanged(share.id);
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

  // R-FC-3. `commentCount` used to be a local COPY seeded from the prop with one
  // writer and nothing to re-seed it, so the card showed a count that had
  // stopped counting the moment anyone else commented. The override that fixes
  // the like does not transfer: `likedByMe` is the reader's own bit, so "cleared
  // when the prop agrees" has a referent, while a count is an aggregate nobody
  // owns and the same sentence has none. So there is no local count at all, only
  // two honest reads of one aggregate.
  //
  // A number beside its list is a caption; the same number alone is a claim.
  // With the list rendered the number must equal what can be counted beside it,
  // even when the prop is fresher: `listComments` filters, orders and returns
  // the whole set with no limit (`HoneycombStore.js:415` to `:424`), so length
  // is the count. A caption correcting itself downward on open and rising when
  // the re-read lands is the honest sequence.
  //
  // LICENCE for `max`, and it is a dependency rather than a decoration: any
  // shrink of the visible comment set also removes the share from the feed. True
  // today on two grounds, BOTH of which must hold. One, no client delete path:
  // `comments` is touched at `HoneycombStore.js:418` (select) and `:431`
  // (insert) and nowhere else. Two, comment visibility is co-extensive with
  // share visibility: `comments_select_if_share_visible`
  // (`20260809000003_fix_likes_comments_visibility.sql:51`) reaches
  // `shares_select_own_or_connections` (`20260808000001:156`) THROUGH the share,
  // so a lost connection unmounts the card instead of shrinking the number in
  // place. `max` is the larger of two honest reads of a quantity that can only
  // grow, which is why it is not an override and needs no clear condition.
  //
  // When that stops holding, `max` comes out and the closed count renders the
  // prop, trading the N+1, N, N+1 flicker on a fresh post back knowingly. The
  // trigger is recorded where the change that breaks it will be read, at
  // `docs/strategy/Pollinate_Strategy.md`, the Tab 3 audience paragraph's Apple
  // 1.2 clause, stated as the property rather than as any one feature's name.
  // Addressed by section rather than by line: a line number into a document is
  // a join key, not a pin, and that paragraph has already moved once.
  //
  // "Open and RENDERED" is the caption's precondition and it is `commentsLoaded`,
  // not `comments.length`. A first open whose read is still in flight, and a
  // first open whose read THREW, both hold an empty list that was never a read
  // of anything — captioning them would render `0` and assert "no comments" on
  // the strength of a request that did not answer. Both fall to the closed-state
  // expression, which claims only what the prop already claimed. A re-fetch is
  // different: the previous list is still on screen, so it stays its own caption.
  const commentsRendered = commentsOpen && commentsLoaded;
  const commentCount = commentsRendered
    ? comments.length
    : Math.max(share.commentCount, comments.length);

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
        {/* R-FC-1a: no `disabled` here. `PressableScale.js:127` hands it to
            `Pressable`, and `Pressable.js:235` is `disabled != null ? {...}`, so
            the state is ANNOUNCED and not merely painted at `:133`'s 0.4 fade.
            Under R-FC-1 the tap fills the heart, appears the count, drops the
            control to 40% and announces it unavailable in one frame. Passing
            `disabledOpacity={1}` only silences the ink and leaves the
            announcement, and passing `disabled={false}` still writes the state,
            because the test is `!= null`. So the prop is dropped and never
            passed false; `:31`'s `if (liking) return;` is the functional
            re-entry block and is untouched. The discriminator for
            `disabledOpacity`'s legitimate uses: an in-place state that says
            WORKING agrees with announced-disabled, one that says DONE
            contradicts it. */}
        <PressableScale onPress={handleLike} style={styles.actionButton}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? theme.colors.accent : theme.colors.textSecondary}
          />
          {likeCount > 0 && <Text style={styles.actionText}>{likeCount}</Text>}
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
          {loadingComments && !commentsLoaded ? (
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
