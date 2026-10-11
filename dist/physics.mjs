// Explicit, idealized teaching models. SI units internally unless specified.
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export function ohm(v, r) { const i=v/r; return {i, p:v*i}; }
export function led(v, r, vf=2, reversed=false) { const i=reversed?0:Math.max(0,(v-vf)/r); return {i,p:i*i*r,brightness:clamp(i/.02,0,1)}; }
export function divider(v, r1, r2, load=Infinity) { const bottom=1/(1/r2+1/load); const out=v*bottom/(r1+bottom); return {out,i:v/(r1+bottom),bottom}; }
export function rc(v,r,c,t,discharge=false) { const tau=r*c; const decay=Math.exp(-t/tau); return {tau,vc:v*(discharge?decay:1-decay),i:(discharge?-1:1)*v/r*decay}; }
export function rl(v,r,l,t) { const tau=l/r; const i=v/r*(1-Math.exp(-t/tau)); return {tau,i,energy:.5*l*i*i}; }
export function regulator(vin,vout,current,dropout=.4) { const actual=Math.max(0,Math.min(vout,vin-dropout)); return {out:actual,p:(vin-actual)*current,eff:vin?actual/vin:0,inRegulation:vin>=vout+dropout}; }
export function amplifier(vin,rf,rg,supply=5) { const gain=1+rf/rg; const ideal=vin*gain; return {gain,ideal,out:clamp(ideal,0,supply),clipped:ideal>supply||ideal<0}; }
