// MP-5: scale feedback has three registers. Unresolved accessibility state
// fails closed with Reduce Motion, resolved Reduce Motion remains locked at
// scale 1, and resolved normal motion may compress on the next gesture.
export const pressFeedbackScalePlan = ({ resolved, reduced }) => {
  const scaleLocked = !resolved || !!reduced;
  return {
    scaleLocked,
    canCompress: !scaleLocked,
  };
};
