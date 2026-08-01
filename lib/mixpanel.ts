import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = "f53cf0631032824d708490beca0fdbd0";

// Standard Mixpanel initialization with improved error handling for mutex timeouts
const initMixpanel = () => {
  if (typeof window === 'undefined') return;
  
  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: false, // Set to false to reduce console noise unless needed
      track_pageview: true,
      persistence: "localStorage",
      ignore_dnt: true,
      record_sessions_percent: 100,
      record_mask_all_inputs: true,
      record_mask_all_text: true,
      // Increase the timeout or handle locking issues if needed
      // Note: mixpanel-browser doesn't have a direct "lock_timeout" config option visible in standard docs,
      // but ensuring single initialization helps significantly.
    });
  } catch (err) {
    console.warn("Mixpanel initialization failed", err);
  }
};

initMixpanel();

export const trackEvent = {
  // Default Events
  signUp: (signupMethod: string, properties?: Record<string, any>) => {
    mixpanel.track('Sign Up', { signup_method: signupMethod, ...properties });
  },
  signIn: (authMethod: string, properties?: Record<string, any>) => {
    mixpanel.track('Sign In', { auth_method: authMethod, ...properties });
  },
  pageView: (url: string, title: string, properties?: Record<string, any>) => {
    mixpanel.track('Page View', { page_url: url, page_title: title, ...properties });
  },
  search: (query: string, resultCount: number, properties?: Record<string, any>) => {
    mixpanel.track('Search', { search_query: query, result_count: resultCount, ...properties });
  },
  error: (errorType: string, message: string, properties?: Record<string, any>) => {
    mixpanel.track('Error', { error_type: errorType, error_message: message, ...properties });
  },
  purchase: (revenue: number, currency: string, properties?: Record<string, any>) => {
    mixpanel.track('Purchase', { revenue, currency, ...properties });
  },
  conversion: (moment: string, properties?: Record<string, any>) => {
    mixpanel.track('Conversion', { moment_type: moment, ...properties });
  },

  // AI Events
  launchAI: (featureName: string, properties?: Record<string, any>) => {
    mixpanel.track('Launch AI', { feature_name: featureName, ...properties });
  },
  aiPromptSent: (promptText: string, properties?: Record<string, any>) => {
    mixpanel.track('AI Prompt Sent', { prompt_text: promptText, ...properties });
  },
  aiResponseSent: (cost?: number, tokenUsage?: number, responseTimeMs?: number, properties?: Record<string, any>) => {
    mixpanel.track('AI Response Sent', { cost, token_usage: tokenUsage, response_time_ms: responseTimeMs, ...properties });
  },
  apiError: (errorType: string, message: string, properties?: Record<string, any>) => {
    mixpanel.track('API Error', { error_type: errorType, error_message: message, ...properties });
  },
  userFeedback: (sentiment: string, feedback: string, properties?: Record<string, any>) => {
    mixpanel.track('User Feedback', { sentiment, feedback_text: feedback, ...properties });
  },
  aiDismissed: (disengagementPoint: string, properties?: Record<string, any>) => {
    mixpanel.track('AI Dismissed', { disengagement_point: disengagementPoint, ...properties });
  },
  aiConversionEvent: (outcome: string, properties?: Record<string, any>) => {
    mixpanel.track('Conversion Event', { ai_outcome: outcome, ...properties });
  }
};

export const enableLocationTracking = async () => {
  try {
    const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    const data = await response.json();
    
    if (data && data.city && data.country) {
      const locationData = {
        $city: data.city,
        $region: data.region,
        $country_code: data.country_code,
        $timezone: data.timezone,
        City: data.city,
        Country: data.country,
        Region: data.region,
        Continent: data.continent_code
      };
      
      // Register makes these properties attach to all subsequent events tracked
      mixpanel.register(locationData);
      
      // We can also attempt to update the person profile if identified
      mixpanel.people.set(locationData);
    }
  } catch (error) {
    console.warn("Could not fetch location data for Mixpanel", error);
  }
};

export default mixpanel;
