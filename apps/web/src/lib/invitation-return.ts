/** Only the existing same-origin invitation route is a valid return destination. */
export function invitationReturn(value:string|null):string|null{
 return value&&/^\/i\/[A-Za-z0-9_-]{16,200}$/.test(value)?value:null;
}
