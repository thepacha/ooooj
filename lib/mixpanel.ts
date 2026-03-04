import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = "f53cf0631032824d708490beca0fdbd0";

mixpanel.init(MIXPANEL_TOKEN, {
  debug: false,
  track_pageview: true,
  persistence: "localStorage",
  ignore_dnt: true,
});

export default mixpanel;
