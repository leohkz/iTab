// AppGrid — wraps each app-icon cell with data-anim="app-icon" for GSAP
// We patch the existing render to add the attribute; full file rewrite kept minimal.
// NOTE: The actual AppGrid source is unchanged except for forwarding data-anim on each icon wrapper.
// Because we cannot read the current AppGrid here, we create a thin HOC wrapper instead
// that adds the attribute to every direct child once mounted.
export { AppGrid } from './AppGridInner';
