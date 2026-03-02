import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = "f53cf0631032824d708490beca0fdbd0";

mixpanel.init(MIXPANEL_TOKEN, {
  debug: true,
  track_pageview: true,
  persistence: "localStorage",
  // @ts-ignore - autocapture might not be in the types but requested by instructions
  autocapture: true, 
  // @ts-ignore - record_sessions_percent might not be in the types
  record_sessions_percent: 100,
});

export default mixpanel;
