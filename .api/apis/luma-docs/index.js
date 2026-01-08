"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'luma-docs/1.0.0 (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
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
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
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
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Return admin information about an event that you have manage access for.
     *
     * @summary Get Event
     */
    SDK.prototype.getV1EventGet = function (metadata) {
        return this.core.fetch('/v1/event/get', 'get', metadata);
    };
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
    SDK.prototype.getV1CalendarListEvents = function (metadata) {
        return this.core.fetch('/v1/calendar/list-events', 'get', metadata);
    };
    /**
     * Get an event guest by looking them up by their ID. This supports looking them up by
     * different parameters.
     *
     * @summary Get Guest
     */
    SDK.prototype.getV1EventGetGuest = function (metadata) {
        return this.core.fetch('/v1/event/get-guest', 'get', metadata);
    };
    /**
     * Get list of guests who have registered or been invited to an event.
     *
     * @summary Get Guests
     */
    SDK.prototype.getV1EventGetGuests = function (metadata) {
        return this.core.fetch('/v1/event/get-guests', 'get', metadata);
    };
    /**
     * Get Self
     *
     */
    SDK.prototype.getV1UserGetSelf = function () {
        return this.core.fetch('/v1/user/get-self', 'get');
    };
    /**
     * List Person Tags
     *
     */
    SDK.prototype.getV1CalendarListPersonTags = function (metadata) {
        return this.core.fetch('/v1/calendar/list-person-tags', 'get', metadata);
    };
    /**
     * Lookup an entity on Luma by it's slug.
     *
     * @summary Lookup Entity
     */
    SDK.prototype.getV1EntityLookup = function (metadata) {
        return this.core.fetch('/v1/entity/lookup', 'get', metadata);
    };
    /**
     * See if an event already exists on the calendar. This is useful when figuring out if you
     * want to submit an event to the calendar.
     *
     * @summary Lookup Event
     */
    SDK.prototype.getV1CalendarLookupEvent = function (metadata) {
        return this.core.fetch('/v1/calendar/lookup-event', 'get', metadata);
    };
    /**
     * List People
     *
     */
    SDK.prototype.getV1CalendarListPeople = function (metadata) {
        return this.core.fetch('/v1/calendar/list-people', 'get', metadata);
    };
    /**
     * List all coupons that have been created for an event..
     *
     * @summary List Event Coupons
     */
    SDK.prototype.getV1EventCoupons = function (metadata) {
        return this.core.fetch('/v1/event/coupons', 'get', metadata);
    };
    /**
     * List all coupons that have been created for a calendar.
     *
     * @summary List Calendar Coupons
     */
    SDK.prototype.getV1CalendarCoupons = function (metadata) {
        return this.core.fetch('/v1/calendar/coupons', 'get', metadata);
    };
    /**
     * List all ticket types for an event
     *
     * @summary List Ticket Types
     */
    SDK.prototype.getV1EventTicketTypesList = function (metadata) {
        return this.core.fetch('/v1/event/ticket-types/list', 'get', metadata);
    };
    /**
     * Get a single ticket type by ID
     *
     * @summary Get Ticket Type
     */
    SDK.prototype.getV1EventTicketTypesGet = function (metadata) {
        return this.core.fetch('/v1/event/ticket-types/get', 'get', metadata);
    };
    /**
     * List available membership tiers for the calendar.
     *
     * @summary List Membership Tiers
     */
    SDK.prototype.getV1MembershipsTiersList = function (metadata) {
        return this.core.fetch('/v1/memberships/tiers/list', 'get', metadata);
    };
    /**
     * List all webhook endpoints for the calendar.
     *
     * @summary List Webhooks
     */
    SDK.prototype.getV1WebhooksList = function (metadata) {
        return this.core.fetch('/v1/webhooks/list', 'get', metadata);
    };
    /**
     * Get details about a specific webhook endpoint.
     *
     * @summary Get Webhook
     */
    SDK.prototype.getV1WebhooksGet = function (metadata) {
        return this.core.fetch('/v1/webhooks/get', 'get', metadata);
    };
    /**
     * Create Event
     *
     */
    SDK.prototype.postV1EventCreate = function (body) {
        return this.core.fetch('/v1/event/create', 'post', body);
    };
    /**
     * Update Event
     *
     */
    SDK.prototype.postV1EventUpdate = function (body) {
        return this.core.fetch('/v1/event/update', 'post', body);
    };
    /**
     * Update Guest Status
     *
     */
    SDK.prototype.postV1EventUpdateGuestStatus = function (body) {
        return this.core.fetch('/v1/event/update-guest-status', 'post', body);
    };
    /**
     * Send guest an invite to an event. We will send an email and if there phone number is
     * linked to their Luma account, they will also receive an SMS.
     *
     * @summary Send Invites
     */
    SDK.prototype.postV1EventSendInvites = function (body) {
        return this.core.fetch('/v1/event/send-invites', 'post', body);
    };
    /**
     * Add guests to the event. They will be added with the status "Going". By default, guests
     * receive one ticket of the default ticket type. Use the `ticket` or `tickets` parameter
     * to specify custom ticket assignments. Get available ticket types using
     * `/v1/event/ticket-types/list`.
     *
     * @summary Add Guests
     */
    SDK.prototype.postV1EventAddGuests = function (body) {
        return this.core.fetch('/v1/event/add-guests', 'post', body);
    };
    /**
     * Name of the host you are adding. If they already have a Luma profile, this will be
     * ignored.
     *
     * @summary Add Host
     */
    SDK.prototype.postV1EventAddHost = function (body) {
        return this.core.fetch('/v1/event/add-host', 'post', body);
    };
    /**
     * Create a coupon that can be applied when a guest is registering for an event. You are
     * not able to edit the coupon terms after it has been created.
     *
     * @summary Create Coupon
     */
    SDK.prototype.postV1EventCreateCoupon = function (body) {
        return this.core.fetch('/v1/event/create-coupon', 'post', body);
    };
    /**
     * Update Coupon
     *
     */
    SDK.prototype.postV1EventUpdateCoupon = function (body) {
        return this.core.fetch('/v1/event/update-coupon', 'post', body);
    };
    /**
     * Create a coupon that can be applied to any event that is managed by the calendar. Be
     * careful not to have the same code on an event and on the calendar.
     *
     * @summary Create Coupon
     */
    SDK.prototype.postV1CalendarCouponsCreate = function (body) {
        return this.core.fetch('/v1/calendar/coupons/create', 'post', body);
    };
    /**
     * Update Coupon
     *
     */
    SDK.prototype.postV1CalendarCouponsUpdate = function (body) {
        return this.core.fetch('/v1/calendar/coupons/update', 'post', body);
    };
    /**
     * Import people to your calendar to easily invite them to events and send them
     * newsletters.
     *
     * @summary Import People
     */
    SDK.prototype.postV1CalendarImportPeople = function (body) {
        return this.core.fetch('/v1/calendar/import-people', 'post', body);
    };
    /**
     * Create Person Tag
     *
     */
    SDK.prototype.postV1CalendarCreatePersonTag = function (body) {
        return this.core.fetch('/v1/calendar/create-person-tag', 'post', body);
    };
    /**
     * Update Person Tag
     *
     */
    SDK.prototype.postV1CalendarUpdatePersonTag = function (body) {
        return this.core.fetch('/v1/calendar/update-person-tag', 'post', body);
    };
    /**
     * Delete Person Tag
     *
     */
    SDK.prototype.postV1CalendarDeletePersonTag = function (body) {
        return this.core.fetch('/v1/calendar/delete-person-tag', 'post', body);
    };
    /**
     * Apply a tag to existing calendar members. This will not create new members.
     *
     * @summary Apply Person Tag
     */
    SDK.prototype.postV1CalendarPersonTagsApply = function (body) {
        return this.core.fetch('/v1/calendar/person-tags/apply', 'post', body);
    };
    /**
     * Remove a tag from calendar members. Only affects existing members.
     *
     * @summary Remove Person Tag
     */
    SDK.prototype.postV1CalendarPersonTagsUnapply = function (body) {
        return this.core.fetch('/v1/calendar/person-tags/unapply', 'post', body);
    };
    /**
     * Add an existing event (on Luma or on an external platform) to the Luma calendar. This
     * will _not_ make the event managed by the calendar.
     *
     * @summary Add Event
     */
    SDK.prototype.postV1CalendarAddEvent = function (body) {
        return this.core.fetch('/v1/calendar/add-event', 'post', body);
    };
    /**
     * Create Upload URL
     *
     */
    SDK.prototype.postV1ImagesCreateUploadUrl = function (body) {
        return this.core.fetch('/v1/images/create-upload-url', 'post', body);
    };
    /**
     * Create a new ticket type for an event
     *
     * @summary Create Ticket Type
     */
    SDK.prototype.postV1EventTicketTypesCreate = function (body) {
        return this.core.fetch('/v1/event/ticket-types/create', 'post', body);
    };
    /**
     * Update an existing ticket type configuration
     *
     * @summary Update Ticket Type
     */
    SDK.prototype.postV1EventTicketTypesUpdate = function (body) {
        return this.core.fetch('/v1/event/ticket-types/update', 'post', body);
    };
    /**
     * Soft delete a ticket type. Cannot delete if tickets have been sold or if it's the last
     * visible ticket type.
     *
     * @summary Delete Ticket Type
     */
    SDK.prototype.postV1EventTicketTypesDelete = function (body) {
        return this.core.fetch('/v1/event/ticket-types/delete', 'post', body);
    };
    /**
     * Add a user to a membership tier. Only supports free tiers - paid tiers require the web
     * payment flow.
     *
     * @summary Add Member to Tier
     */
    SDK.prototype.postV1MembershipsMembersAdd = function (body) {
        return this.core.fetch('/v1/memberships/members/add', 'post', body);
    };
    /**
     * Update a member's membership status. Approving a paid tier member captures their
     * payment. Declining cancels any active subscription.
     *
     * @summary Update Member Status
     */
    SDK.prototype.postV1MembershipsMembersUpdateStatus = function (body) {
        return this.core.fetch('/v1/memberships/members/update-status', 'post', body);
    };
    /**
     * Create a new webhook endpoint to receive event notifications.
     *
     * @summary Create Webhook
     */
    SDK.prototype.postV1WebhooksCreate = function (body) {
        return this.core.fetch('/v1/webhooks/create', 'post', body);
    };
    /**
     * Update a webhook endpoint's event types or status (active/paused).
     *
     * @summary Update Webhook
     */
    SDK.prototype.postV1WebhooksUpdate = function (body) {
        return this.core.fetch('/v1/webhooks/update', 'post', body);
    };
    /**
     * Delete a webhook endpoint.
     *
     * @summary Delete Webhook
     */
    SDK.prototype.postV1WebhooksDelete = function (body) {
        return this.core.fetch('/v1/webhooks/delete', 'post', body);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
