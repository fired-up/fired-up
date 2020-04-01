/**
 * Log some details about API request for aggregation inside of StackDriver
 * @param component Name of the overall functionality this API request is for (ie Sendgrid, BigQuery)
 * @param context Name of the Firebase Function that was called
 * @param method GET, POST, PATCH etc
 * @param resource Method + URL of the API call
 * @param status status code of response
 * @param initiator Email address of whomever called this function, if available
 */
export function logAPIrequest(
  component: string,
  context: string,
  method: string,
  resource: string,
  status: number
) {
  console.log(
    `${component} - ${context} - ${method} - ${resource} - ${status}`
  );
}
