import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { CombStore } from '../services/CombStore';
import { NectarStore } from '../services/NectarStore';
import { hasNectarConsent } from '../constants/nectar';
import { randomUUID } from '../utils/uuid';
import { ScreenHeader } from '../components/ScreenHeader';
import { PressableScale } from '../components/PressableScale';
import { NectarSendPanel, isSendableAmount } from '../components/NectarSendPanel';

const wordCount = (note) => note.trim().split(/\s+/u).filter(Boolean).length;

// DES-32's any-time entry.  This is deliberately the same amount surface as
// the reveal, but its commit is ENG-90's note RPC -- never a target-kind arm
// on recordZap.
export const CombNectarComposeScreen = ({ navigation, route }) => {
  const { combId } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipientId, setRecipientId] = useState(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState(null);
  const [custom, setCustom] = useState('');
  const [balanceDrops, setBalanceDrops] = useState(null);
  const [consentRow, setConsentRow] = useState(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [senderInactive, setSenderInactive] = useState(false);
  const [balanceRefresh, setBalanceRefresh] = useState(0);
  const [balanceChangePending, setBalanceChangePending] = useState(false);
  const sendId = useRef(randomUUID());
  const nectarConsent = hasNectarConsent(consentRow);

  useEffect(() => {
    let cancelled = false;
    Promise.all([CombStore.listMembers(combId), NectarStore.getConsent()])
      .then(([rows, consent]) => {
        if (cancelled) return;
        setMembers(rows);
        setConsentRow(consent);
      })
      .catch((err) => console.warn('CombNectarCompose: failed to load compose facts', err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [combId]);

  useEffect(() => {
    if (!nectarConsent) return;
    NectarStore.getBalanceDrops()
      .then((drops) => {
        setBalanceDrops(drops);
        if (balanceChangePending && Number.isFinite(drops)) {
          setValidationMessage(`Your balance changed. You have ${drops} drops now.`);
          setBalanceChangePending(false);
        }
      })
      .catch(() => {
        setBalanceDrops(null);
        if (balanceChangePending) {
          setBalanceChangePending(false);
          setFailed(true);
        }
      });
  }, [nectarConsent, balanceRefresh, balanceChangePending]);

  const resolvedAmount = custom.trim() ? Number(custom.trim()) : amount;
  const noteIsValid = wordCount(note) >= 1 && wordCount(note) <= 8 && note.length <= 280;
  const sendable = Boolean(recipientId) && noteIsValid && isSendableAmount(resolvedAmount, balanceDrops);
  const recipient = members.find((member) => member.profile_id === recipientId);

  // A retry is the *same* request. Any edit makes a new bound payload and
  // therefore retires the old idempotency key before the next submission.
  const retireAttempt = useCallback(() => {
    sendId.current = randomUUID();
    setFailed(false);
    setValidationMessage(null);
  }, []);

  const changeNote = useCallback((value) => {
    retireAttempt();
    setNote(value);
  }, [retireAttempt]);

  const chooseRecipient = useCallback((id) => {
    retireAttempt();
    setRecipientId(id);
  }, [retireAttempt]);

  const choosePreset = useCallback((value) => {
    retireAttempt();
    setAmount(value);
    setCustom('');
  }, [retireAttempt]);

  const changeCustom = useCallback((value) => {
    retireAttempt();
    setAmount(null);
    setCustom(value);
  }, [retireAttempt]);

  const send = async () => {
    if (sending) return;
    if (!note.trim()) return setValidationMessage('Add a note first.');
    if (wordCount(note) > 8) return setValidationMessage('Keep it to 8 words.');
    if (note.length > 280) return setValidationMessage('Keep the note under 280 characters.');
    if (!isSendableAmount(resolvedAmount, balanceDrops)) return setValidationMessage('Choose 1–1,000 drops.');
    if (!recipientId) return setValidationMessage('Choose someone else in this comb.');
    setValidationMessage(null);
    setSending(true); setFailed(false);
    try {
      await NectarStore.sendCombNectarNote({ sendId: sendId.current, combId, recipientId, note: note.trim(), amountDrops: resolvedAmount });
      setBalanceRefresh((value) => value + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const message = `Sent ${resolvedAmount} drops to ${recipient?.display_name ?? 'your comb member'}.`;
      setSuccessMessage(message);
      AccessibilityInfo.announceForAccessibility(message);
      // The sheet closes into the departure beat instead of adding a success
      // card. The balance is refreshed above before this transition.
      navigation.goBack();
    } catch (err) {
      console.warn('CombNectarCompose: send failed', err);
      const refusal = String(err?.message ?? '');
      if (/recipient not eligible/i.test(refusal)) {
        setRecipientId(null);
        setValidationMessage("This person isn't available in this comb anymore.");
      } else if (/cannot send to yourself/i.test(refusal)) {
        setValidationMessage('Choose someone else in this comb.');
      } else if (/insufficient nectar/i.test(refusal)) {
        setAmount(null);
        setCustom('');
        setBalanceChangePending(true);
        setBalanceRefresh((value) => value + 1);
      } else if (/note must contain between 1 and 8 words/i.test(refusal)) {
        setValidationMessage('Keep it to 8 words.');
      } else if (/note is too long/i.test(refusal)) {
        setValidationMessage('Keep the note under 280 characters.');
      } else if (/amount must be between 1 and 1000 drops/i.test(refusal)) {
        setValidationMessage('Choose 1–1,000 drops.');
      } else if (/nectar consent required/i.test(refusal)) {
        setValidationMessage('Turn this on from a reveal before sending.');
      } else if (/not signed in/i.test(refusal)) {
        setValidationMessage('Sign in again to send this.');
      } else if (/sender is not an active comb member/i.test(refusal)) {
        setValidationMessage("You’re no longer in this comb.");
        setSenderInactive(true);
      } else if (/already recorded with different parameters/i.test(refusal)) {
        await NectarStore.listCombNectarNotes(combId).catch(() => []);
        setValidationMessage('A gift from this attempt was already sent. Refresh before sending another.');
      } else {
        // Preserve the exact payload and send id: pressing Send is an exact
        // replay, while any edit above creates a new attempt.
        setFailed(true);
      }
    } finally { setSending(false); }
  };

  return <View style={styles.container}>
    <ScreenHeader eyebrow="" title="A little thanks" right={<PressableScale onPress={() => navigation.goBack()}><Text style={styles.close}>×</Text></PressableScale>} />
    {loading ? <ActivityIndicator color={theme.colors.accent} /> : <>
      <Text style={styles.label}>TO</Text>
      <View style={styles.members}>{members.map((member) => <PressableScale key={member.profile_id} onPress={() => chooseRecipient(member.profile_id)} style={[styles.member, recipientId === member.profile_id && styles.selected]}><Text style={styles.memberName}>{member.display_name}</Text></PressableScale>)}</View>
      <Text style={styles.target}>To {recipient?.display_name ?? 'someone in this comb'}</Text>
      {!nectarConsent ? <View style={styles.consent}><Text style={styles.consentText}>Turn this on from a reveal before sending.</Text></View> : senderInactive ? <PressableScale onPress={() => navigation.goBack()} style={styles.consent}><Text style={styles.consentText}>Not now</Text></PressableScale> : <NectarSendPanel nectarConsent={nectarConsent} balanceDrops={balanceDrops} selected={amount} onSelect={choosePreset} customValue={custom} onChangeCustom={changeCustom} note={note} onChangeNote={changeNote} sending={sending} failed={failed} sendDisabled={!sendable} onSend={send} onCancel={() => navigation.goBack()} />}
      {nectarConsent && <><Text style={styles.words}>{wordCount(note)}/8 words</Text>{validationMessage && <Text style={styles.validation}>{validationMessage}</Text>}</>}
      {successMessage && <Text accessibilityLiveRegion="polite" style={styles.srOnly}>{successMessage}</Text>}
    </>}
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.backgroundWriting, padding: 24, paddingTop: 64 },
  close: { ...theme.type.h2, color: theme.colors.ink }, label: { ...theme.type.label, color: theme.colors.inkSoft, marginTop: 20, marginBottom: 8 }, target: { ...theme.type.bodySm, color: theme.colors.inkSoft, marginBottom: 16 },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, member: { borderWidth: 1, borderColor: theme.colors.inkSoft, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.borderRadius.large }, selected: { backgroundColor: theme.colors.washYellow, borderColor: theme.colors.ink }, memberName: { ...theme.type.bodySm, color: theme.colors.ink }, consent: { padding: 18, borderRadius: theme.borderRadius.large, backgroundColor: theme.colors.surface }, consentText: { ...theme.type.body, color: theme.colors.ink }, words: { ...theme.type.bodySm, color: theme.colors.inkSoft, textAlign: 'right', marginTop: 8 }, validation: { ...theme.type.bodySm, color: theme.colors.ink, textAlign: 'center', marginTop: 8 }, srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
