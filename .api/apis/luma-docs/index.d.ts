import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config: ConfigOptions): void;
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values: string[] | number[]): this;
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url: string, variables?: {}): void;
    /**
     * Return admin information about an event that you have manage access for.
     *
     * @summary Get Event
     */
    getV1EventGet(metadata?: types.GetV1EventGetMetadataParam): Promise<FetchResponse<200, types.GetV1EventGetResponse200>>;
    /**
     * Every event and API key on Luma is managed by a [Luma
     * Calendar](https://help.luma.com/p/luma-calendar-overview). You can list all of the
     * events managed by your Calendar by using this API route.
     *
     * Note that this API route will not list events that are listed on the Calendar but not
     * managed by the Calendar.
     *
     * @summary List Events
     */
    getV1CalendarListEvents(metadata?: types.GetV1CalendarListEventsMetadataParam): Promise<FetchResponse<200, types.GetV1CalendarListEventsResponse200>>;
    /**
     * Get an event guest by looking them up by their ID. This supports looking them up by
     * different parameters.
     *
     * @summary Get Guest
     */
    getV1EventGetGuest(metadata?: types.GetV1EventGetGuestMetadataParam): Promise<FetchResponse<200, types.GetV1EventGetGuestResponse200>>;
    /**
     * Get list of guests who have registered or been invited to an event.
     *
     * @summary Get Guests
     */
    getV1EventGetGuests(metadata?: types.GetV1EventGetGuestsMetadataParam): Promise<FetchResponse<200, types.GetV1EventGetGuestsResponse200>>;
    /**
     * Get Self
     *
     */
    getV1UserGetSelf(): Promise<FetchResponse<200, types.GetV1UserGetSelfResponse200>>;
    /**
     * List Person Tags
     *
     */
    getV1CalendarListPersonTags(metadata?: types.GetV1CalendarListPersonTagsMetadataParam): Promise<FetchResponse<200, types.GetV1CalendarListPersonTagsResponse200>>;
    /**
     * Lookup an entity on Luma by it's slug.
     *
     * @summary Lookup Entity
     */
    getV1EntityLookup(metadata: types.GetV1EntityLookupMetadataParam): Promise<FetchResponse<200, types.GetV1EntityLookupResponse200>>;
    /**
     * See if an event already exists on the calendar. This is useful when figuring out if you
     * want to submit an event to the calendar.
     *
     * @summary Lookup Event
     */
    getV1CalendarLookupEvent(metadata?: types.GetV1CalendarLookupEventMetadataParam): Promise<FetchResponse<200, types.GetV1CalendarLookupEventResponse200>>;
    /**
     * List People
     *
     */
    getV1CalendarListPeople(metadata?: types.GetV1CalendarListPeopleMetadataParam): Promise<FetchResponse<200, types.GetV1CalendarListPeopleResponse200>>;
    /**
     * List all coupons that have been created for an event..
     *
     * @summary List Event Coupons
     */
    getV1EventCoupons(metadata?: types.GetV1EventCouponsMetadataParam): Promise<FetchResponse<200, types.GetV1EventCouponsResponse200>>;
    /**
     * List all coupons that have been created for a calendar.
     *
     * @summary List Calendar Coupons
     */
    getV1CalendarCoupons(metadata?: types.GetV1CalendarCouponsMetadataParam): Promise<FetchResponse<200, types.GetV1CalendarCouponsResponse200>>;
    /**
     * List all ticket types for an event
     *
     * @summary List Ticket Types
     */
    getV1EventTicketTypesList(metadata?: types.GetV1EventTicketTypesListMetadataParam): Promise<FetchResponse<200, types.GetV1EventTicketTypesListResponse200>>;
    /**
     * Get a single ticket type by ID
     *
     * @summary Get Ticket Type
     */
    getV1EventTicketTypesGet(metadata?: types.GetV1EventTicketTypesGetMetadataParam): Promise<FetchResponse<200, types.GetV1EventTicketTypesGetResponse200>>;
    /**
     * List available membership tiers for the calendar.
     *
     * @summary List Membership Tiers
     */
    getV1MembershipsTiersList(metadata?: types.GetV1MembershipsTiersListMetadataParam): Promise<FetchResponse<200, types.GetV1MembershipsTiersListResponse200>>;
    /**
     * List all webhook endpoints for the calendar.
     *
     * @summary List Webhooks
     */
    getV1WebhooksList(metadata?: types.GetV1WebhooksListMetadataParam): Promise<FetchResponse<200, types.GetV1WebhooksListResponse200>>;
    /**
     * Get details about a specific webhook endpoint.
     *
     * @summary Get Webhook
     */
    getV1WebhooksGet(metadata: types.GetV1WebhooksGetMetadataParam): Promise<FetchResponse<200, types.GetV1WebhooksGetResponse200>>;
    /**
     * Create Event
     *
     */
    postV1EventCreate(body: types.PostV1EventCreateBodyParam): Promise<FetchResponse<200, types.PostV1EventCreateResponse200>>;
    /**
     * Update Event
     *
     */
    postV1EventUpdate(body: types.PostV1EventUpdateBodyParam): Promise<FetchResponse<200, types.PostV1EventUpdateResponse200>>;
    /**
     * Update Guest Status
     *
     */
    postV1EventUpdateGuestStatus(body: types.PostV1EventUpdateGuestStatusBodyParam): Promise<FetchResponse<200, types.PostV1EventUpdateGuestStatusResponse200>>;
    /**
     * Send guest an invite to an event. We will send an email and if there phone number is
     * linked to their Luma account, they will also receive an SMS.
     *
     * @summary Send Invites
     */
    postV1EventSendInvites(body: types.PostV1EventSendInvitesBodyParam): Promise<FetchResponse<200, types.PostV1EventSendInvitesResponse200>>;
    /**
     * Add guests to the event. They will be added with the status "Going". By default, guests
     * receive one ticket of the default ticket type. Use the `ticket` or `tickets` parameter
     * to specify custom ticket assignments. Get available ticket types using
     * `/v1/event/ticket-types/list`.
     *
     * @summary Add Guests
     */
    postV1EventAddGuests(body: types.PostV1EventAddGuestsBodyParam): Promise<FetchResponse<200, types.PostV1EventAddGuestsResponse200>>;
    /**
     * Name of the host you are adding. If they already have a Luma profile, this will be
     * ignored.
     *
     * @summary Add Host
     */
    postV1EventAddHost(body: types.PostV1EventAddHostBodyParam): Promise<FetchResponse<200, types.PostV1EventAddHostResponse200>>;
    /**
     * Create a coupon that can be applied when a guest is registering for an event. You are
     * not able to edit the coupon terms after it has been created.
     *
     * @summary Create Coupon
     */
    postV1EventCreateCoupon(body: types.PostV1EventCreateCouponBodyParam): Promise<FetchResponse<200, types.PostV1EventCreateCouponResponse200>>;
    /**
     * Update Coupon
     *
     */
    postV1EventUpdateCoupon(body: types.PostV1EventUpdateCouponBodyParam): Promise<FetchResponse<200, types.PostV1EventUpdateCouponResponse200>>;
    /**
     * Create a coupon that can be applied to any event that is managed by the calendar. Be
     * careful not to have the same code on an event and on the calendar.
     *
     * @summary Create Coupon
     */
    postV1CalendarCouponsCreate(body: types.PostV1CalendarCouponsCreateBodyParam): Promise<FetchResponse<200, types.PostV1CalendarCouponsCreateResponse200>>;
    /**
     * Update Coupon
     *
     */
    postV1CalendarCouponsUpdate(body: types.PostV1CalendarCouponsUpdateBodyParam): Promise<FetchResponse<200, types.PostV1CalendarCouponsUpdateResponse200>>;
    /**
     * Import people to your calendar to easily invite them to events and send them
     * newsletters.
     *
     * @summary Import People
     */
    postV1CalendarImportPeople(body: types.PostV1CalendarImportPeopleBodyParam): Promise<FetchResponse<200, types.PostV1CalendarImportPeopleResponse200>>;
    /**
     * Create Person Tag
     *
     */
    postV1CalendarCreatePersonTag(body: types.PostV1CalendarCreatePersonTagBodyParam): Promise<FetchResponse<200, types.PostV1CalendarCreatePersonTagResponse200>>;
    /**
     * Update Person Tag
     *
     */
    postV1CalendarUpdatePersonTag(body: types.PostV1CalendarUpdatePersonTagBodyParam): Promise<FetchResponse<200, types.PostV1CalendarUpdatePersonTagResponse200>>;
    /**
     * Delete Person Tag
     *
     */
    postV1CalendarDeletePersonTag(body: types.PostV1CalendarDeletePersonTagBodyParam): Promise<FetchResponse<200, types.PostV1CalendarDeletePersonTagResponse200>>;
    /**
     * Apply a tag to existing calendar members. This will not create new members.
     *
     * @summary Apply Person Tag
     */
    postV1CalendarPersonTagsApply(body: types.PostV1CalendarPersonTagsApplyBodyParam): Promise<FetchResponse<200, types.PostV1CalendarPersonTagsApplyResponse200>>;
    /**
     * Remove a tag from calendar members. Only affects existing members.
     *
     * @summary Remove Person Tag
     */
    postV1CalendarPersonTagsUnapply(body: types.PostV1CalendarPersonTagsUnapplyBodyParam): Promise<FetchResponse<200, types.PostV1CalendarPersonTagsUnapplyResponse200>>;
    /**
     * Add an existing event (on Luma or on an external platform) to the Luma calendar. This
     * will _not_ make the event managed by the calendar.
     *
     * @summary Add Event
     */
    postV1CalendarAddEvent(body: types.PostV1CalendarAddEventBodyParam): Promise<FetchResponse<200, types.PostV1CalendarAddEventResponse200>>;
    /**
     * Create Upload URL
     *
     */
    postV1ImagesCreateUploadUrl(body: types.PostV1ImagesCreateUploadUrlBodyParam): Promise<FetchResponse<200, types.PostV1ImagesCreateUploadUrlResponse200>>;
    /**
     * Create a new ticket type for an event
     *
     * @summary Create Ticket Type
     */
    postV1EventTicketTypesCreate(body: types.PostV1EventTicketTypesCreateBodyParam): Promise<FetchResponse<200, types.PostV1EventTicketTypesCreateResponse200>>;
    /**
     * Update an existing ticket type configuration
     *
     * @summary Update Ticket Type
     */
    postV1EventTicketTypesUpdate(body: types.PostV1EventTicketTypesUpdateBodyParam): Promise<FetchResponse<200, types.PostV1EventTicketTypesUpdateResponse200>>;
    /**
     * Soft delete a ticket type. Cannot delete if tickets have been sold or if it's the last
     * visible ticket type.
     *
     * @summary Delete Ticket Type
     */
    postV1EventTicketTypesDelete(body: types.PostV1EventTicketTypesDeleteBodyParam): Promise<FetchResponse<200, types.PostV1EventTicketTypesDeleteResponse200>>;
    /**
     * Add a user to a membership tier. Only supports free tiers - paid tiers require the web
     * payment flow.
     *
     * @summary Add Member to Tier
     */
    postV1MembershipsMembersAdd(body: types.PostV1MembershipsMembersAddBodyParam): Promise<FetchResponse<200, types.PostV1MembershipsMembersAddResponse200>>;
    /**
     * Update a member's membership status. Approving a paid tier member captures their
     * payment. Declining cancels any active subscription.
     *
     * @summary Update Member Status
     */
    postV1MembershipsMembersUpdateStatus(body: types.PostV1MembershipsMembersUpdateStatusBodyParam): Promise<FetchResponse<200, types.PostV1MembershipsMembersUpdateStatusResponse200>>;
    /**
     * Create a new webhook endpoint to receive event notifications.
     *
     * @summary Create Webhook
     */
    postV1WebhooksCreate(body: types.PostV1WebhooksCreateBodyParam): Promise<FetchResponse<200, types.PostV1WebhooksCreateResponse200>>;
    /**
     * Update a webhook endpoint's event types or status (active/paused).
     *
     * @summary Update Webhook
     */
    postV1WebhooksUpdate(body: types.PostV1WebhooksUpdateBodyParam): Promise<FetchResponse<200, types.PostV1WebhooksUpdateResponse200>>;
    /**
     * Delete a webhook endpoint.
     *
     * @summary Delete Webhook
     */
    postV1WebhooksDelete(body: types.PostV1WebhooksDeleteBodyParam): Promise<FetchResponse<200, types.PostV1WebhooksDeleteResponse200>>;
}
declare const createSDK: SDK;
export = createSDK;
