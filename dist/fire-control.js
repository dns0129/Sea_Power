// Explicit player rules of engagement take precedence over mission automation.
export const freeFireEnabled=u=>typeof u.fireAtWill==='boolean'?u.fireAtWill:!!u.autoEngage;
