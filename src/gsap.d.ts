// Ambient shim — tells TypeScript that 'gsap' is a valid module.
// The real types ship inside node_modules/gsap; we just need TS to
// accept the import without adding 'gsap' to the types[] whitelist.
declare module 'gsap' {
  // Re-export the actual gsap module types from its own package entry.
  export * from '../node_modules/gsap/types/gsap';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gsap: any;
  export { gsap };
  export default gsap;
}
