import "@vaadin/button";
import "@vaadin/horizontal-layout";
import "@vaadin/icon";
import "@vaadin/icons";
import "@vaadin/vertical-layout";
import "@vaadin/virtual-list";
import "@vaadin/checkbox";
import "@vaadin/checkbox-group";
import "@vaadin/text-field";
import "@vaadin/date-picker";

import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { Scope } from "@fundwave/openapi-client/developerPortal/dist/models";
import { TokensAPIClient } from "@fundwave/openapi-client/developerPortal/src";
import { Router } from "@vaadin/router";

import type { DatePickerChangeEvent } from "@vaadin/date-picker";
import type { CheckboxGroupValueChangedEvent } from "@vaadin/checkbox-group";
@customElement("generate-token")
export class GenerateToken extends LitElement {

  @property({ type: Number })
  private MIN = 0;
  
  @property({ type: Number })
  private MAX = 526000;
  
  @state()
  private tokenName: string;
  
  @state()
  private tokenExpiration: number;
  
  @state()
  private selectedScopes: string[];

  @state()
  private fetchedClientScopes: Scope[];
  
  @state()
  private loading: Boolean
  
  constructor() {
    super();
    this.loading = true
    this.tokenName = "";
    this.tokenExpiration = 0;
    this.selectedScopes = [];
    this.fetchedClientScopes = [];
  }

  protected override async firstUpdated() {
    try {
      this.loading = true;
      const realm = localStorage.getItem("realm") ?? "master";
      this.fetchedClientScopes = await TokensAPIClient.getClientScopes(realm);
      this.selectedScopes = this.fetchedClientScopes.map(
        (scope) => scope.name
      ) as string[];
    } catch (error) {
      console.log(error);
      Router.go("/error");
    } finally {
      this.loading = false;
    }
  }

  private handleTokenName = (event: Event) => {
    const value: string = (event.target as HTMLInputElement).value;
    if (value.length > 20) {
      const trimmedValue = value.substring(0, 20);
      (event.target as HTMLInputElement).value = trimmedValue;
    }
    this.tokenName = (event.target as HTMLInputElement).value;
  };

  private handleDatePicker = ({ target }: DatePickerChangeEvent) => {
    const currentDate = new Date();
    const selectedDate = new Date(target.value);
    const differenceInMilliseconds =
      selectedDate.getTime() - currentDate.getTime();
    const differenceInMinutes = Math.floor(differenceInMilliseconds / 60000);
    if (differenceInMinutes > this.MAX) {
      target.value = "";
      target.invalid = true;
      target.errorMessage = "Not more than 1 year!";
    } else if (differenceInMinutes <= this.MIN) {
      target.value = "";
      target.invalid = true;
      target.errorMessage = "Not in the past!";
    } else if (target.value == "") {
      target.errorMessage;
    } else {
      target.invalid = false;
      target.errorMessage = "";
      this.tokenExpiration = differenceInMinutes;
    }
  };

  private handleCheckBoxGroup = (event: CheckboxGroupValueChangedEvent) => {
    const selectedselectedScopes: string[] = event.detail.value;
    this.selectedScopes = selectedselectedScopes;
  };

  private handleGenerateToken = async (event: Event) => {
    try {
      const validInput = this.handleInputValidator();
      if (validInput) {
        this.loading = true;
        const realm: string = localStorage.getItem("realm") ?? "master";
        const serverUrl: string =
        import.meta.env.MODE == "development"
            ? "http://localhost:3000"
            : "https://apitoken-service-dev-fmop7ymbka-uc.a.run.app";
        const token = sessionStorage.getItem("token");
        const params = new URLSearchParams();
        params.append("name", this.tokenName);
        params.append("scopes", this.selectedScopes.join(" "));
        params.append("redirectUri", window.location.origin + "/");
        params.append("custom_exp", this.tokenExpiration.toString());
        const redirectUrl =
          `${serverUrl}/${realm}/token` +
          "?" +
          params.toString() +
          `&token=${token}`;
        window.location.replace(redirectUrl);
      } else {
        event.preventDefault();
      }
    } catch (error) {
      this.loading = false;
      console.log(error);
      Router.go("/error");
    }
  };

  private handleGenerateTokenCancel = () => {
    Router.go("/");
  };

  private handleInputValidator() {
    const tokenName: any = this.shadowRoot?.querySelector("#token-name");
    const tokenExpiry: any = this.shadowRoot?.querySelector(
      "#token-expiry-date-picker"
    );
    let error: boolean = false;
    if (tokenExpiry.value == "") {
      tokenExpiry.invalid = true;
      tokenExpiry.errorMessage = "Expiration date is required.";
      error = true;
    }
    if (tokenName.value == "") {
      tokenName.invalid = true;
      tokenName.errorMessage = "Token name is required.";
      error = true;
    }
    if (error) {
      return false;
    }
    return true;
  }

  protected override render() {
    return html`
      <vaadin-vertical-layout class="token-layout" theme="padding">
        <vaadin-horizontal-layout
          class="token-layout-subhead"
          style="justify-content:space-between;align-items:center;width:100%;margin:10px 0;"
        >
          <h2
            style="margin:0; font-weight: 400;font-size: var(--lumo-font-size-xl);border-bottom:1px solid #d6d8db;padding-bottom:10px;width:100%;"
          >
            New Access Token
          </h2>
        </vaadin-horizontal-layout>
        <vaadin-text-field
          id="token-name"
          required
          error-message="The token requires a name"
          label="Token Name"
          placeholder="Lucky Token!"
          helper-text="Unique name for this token."
          clear-button-visible
          @input="${this.handleTokenName}"
        >
        </vaadin-text-field>
        <vaadin-date-picker
          id="token-expiry-date-picker"
          required
          id="date-picker"
          min=${new Date().toISOString().split("T")[0]}
          max=${new Date(new Date().setDate(new Date().getDate() + 365))
            .toISOString()
            .split("T")[0]}
          label="Expiration"
          placeholder="Choose Expiration"
          helper-text="Must be within 1 year from today."
          clear-button-visible
          @change="${this.handleDatePicker}"
        ></vaadin-date-picker>
        <vaadin-checkbox-group
          id="checkbox-group"
          label="scope"
          theme="vertical"
          .value="${this.selectedScopes}"
          style="width:100%; height: calc(var(--vaadin-virtual-list-item-height) * var(--vaadin-virtual-list-size));"
          @value-changed="${this.handleCheckBoxGroup}"
        >
          ${this.fetchedClientScopes.map((scope) => {
            return html`
              <vaadin-checkbox
                disabled
                value="${scope.name as string}"
                label="${scope.name} - ${scope.description}"
              ></vaadin-checkbox>
            `;
          })}
        </vaadin-checkbox-group>
        <vaadin-horizontal-layout theme="spacing-l">
          <vaadin-vertical-layout>
            <vaadin-button
              id="generate-token-button"
              @click=${this.handleGenerateToken}
              style="cursor:pointer;border:0.5px solid #d6d8db;background:#1F1F1F;color:white;"
              >Generate Token</vaadin-button
            >
          </vaadin-vertical-layout>
          <vaadin-button
            @click=${this.handleGenerateTokenCancel}
            theme="tertiary"
            style="cursor:pointer;"
            >Cancel</vaadin-button
          >
        </vaadin-horizontal-layout>
        ${this.loading ? html` <div class="v-loading-indicator"></div> ` : null}
      </vaadin-vertical-layout>
    `;
  }

  static styles = css`
    .token-layout {
      margin: 0rem;
    }
    @media (min-width: 560px) {
      .token-layout {
        margin: 0 5rem;
      }
    }
    @media (min-width: 768px) {
      .token-layout {
        margin: 0 8rem;
      }
    }
    @media (min-width: 1440px) {
      .token-layout {
        margin: 0 15rem;
      }
    }

    .v-loading-indicator {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: auto;
      animation: fadein 0.3s ease-out 0.2s normal 1 both;
      z-index: 2147483647;
    }
    .v-loading-indicator:before {
      left: 50%;
      top: 50%;
      width: 50px;
      height: 50px;
      margin: -38px 0 0 -38px;
      position: absolute;
      content: "";
      border: 8px solid #fff;
      border-radius: 50%;
      animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      border-color: #fff transparent transparent transparent;
    }
    @keyframes lds-ring {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    @keyframes fadein {
      0% {
        background: rgba(0, 0, 0, 0);
      }
      100% {
        background: rgba(0, 0, 0, 0.5); /* Darkens the UI */
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "generate-token": GenerateToken;
  }
}
