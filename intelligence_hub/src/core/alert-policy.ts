import type { QuietHours } from "../domain/types.js";
function minutes(v:string):number{const [h,m]=v.split(":").map(Number);return (h??0)*60+(m??0);}
export function isQuietTime(now:Date,q:QuietHours):boolean{const current=now.getHours()*60+now.getMinutes(),start=minutes(q.start),end=minutes(q.end);return start<=end?current>=start&&current<end:current>=start||current<end;}
export function shouldNotify(score:number,threshold:number,now:Date,q:QuietHours):boolean{return score>=threshold&&!isQuietTime(now,q);}
