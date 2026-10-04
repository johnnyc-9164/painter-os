'use client';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
/** Controlled workspace dialog: Base UI manages the focus trap, Escape, scroll lock and focus restoration. */
export function ModalDialog({open,onClose,children,className='',labelledBy}:{open:boolean;onClose:()=>void;children:ReactNode;className?:string;labelledBy:string}) {
 return <DialogPrimitive.Root open={open} onOpenChange={value=>{if(!value)onClose();}}>
  <DialogPrimitive.Portal>
   <DialogPrimitive.Backdrop className="painter-backdrop"/>
   <DialogPrimitive.Popup className={`painter-dialog ${className}`} aria-labelledby={labelledBy}>{children}</DialogPrimitive.Popup>
  </DialogPrimitive.Portal>
 </DialogPrimitive.Root>;
}
