import "@vaadin/button";
import "@vaadin/horizontal-layout";
import "@vaadin/icon";
import "@vaadin/icons";
import "@vaadin/vertical-layout";
import "@vaadin/virtual-list";

import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { IssuedToken } from "@fundwave/openapi-client/developerPortal/dist/models";
import { TokensAPIClient } from "@fundwave/openapi-client/developerPortal/src";
import { Router } from "@vaadin/router";
import { virtualListRenderer } from "@vaadin/virtual-list/lit";

import type { VirtualListLitRenderer } from "@vaadin/virtual-list/lit";
@customElement("client-dashboard")
export class ClientDashBoard extends LitElement {
  @state()
  private loading: Boolean;

  @state()
  private newCreatedToken: IssuedToken;

  @state()
  private tokenList: IssuedToken[];

  constructor() {
    super();
    this.loading = false;
    this.newCreatedToken = {} as IssuedToken;
    this.tokenList = [];
  }

  protected override async firstUpdated() {
    try {
      this.loading = true;
      const realm = localStorage.getItem("realm") ?? "master";
      this.tokenList = await TokensAPIClient.getIssuedTokens(realm);
    } catch (error) {
      Router.go("/error");
      console.log(error);
    } finally {
      this.loading = false;
    }
  }

  private handleGenerateToken() {
    Router.go("/generate_access_token");
  }

  private handleTokenRevoke = async (id: string): Promise<void> => {
    try {
      this.loading = true;
      const realm = localStorage.getItem("realm") ?? "master";
      await TokensAPIClient.revokeToken(realm, id);
      const newTokenList: IssuedToken[] = await TokensAPIClient.getIssuedTokens(
        realm
      );
      this.tokenList = newTokenList;
    } catch (error) {
      console.log(error);
    } finally {
      this.loading = false;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    this.checkForCallbackResponse();
  }

  checkForCallbackResponse() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    if (tokenParam) {
      this.newCreatedToken = JSON.parse(decodeURIComponent(tokenParam));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  private handleCopyToClipBoard = () => {
    const textToCopy: string = this.newCreatedToken.accessToken as string;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert("Token copied to clipboard");
      })
      .catch((error) => {
        alert("Failed to copy token to clipboard:");
        console.log(error);
      });
  };

  private tokenCardRenderer: VirtualListLitRenderer<IssuedToken> = (token) =>
    token.id == this.newCreatedToken.id
      ? html`
          <vaadin-vertical-layout
            theme="spacing-s padding"
            style="border-bottom:1px solid #d6d8db;flex-wrap:wrap;background-color:#f0f9ec;width:100%;"
          >
            <h2
              style="margin:0;font-weight: 300;font-size: var(--lumo-font-size-s);"
            >
              Make sure to copy your access token now as you will not be able to
              see this again.
            </h2>
            <vaadin-horizontal-layout
              style="align-items:center;justify-content:space-between;width:100%;flex-wrap:wrap;"
            >
              <vaadin-vertical-layout>
                <b style="font-weight:400;"
                  >${this.newCreatedToken.tokenName}</b
                >
                <vaadin-horizontal-layout theme="spacing-s">
                  <vaadin-text-field
                    id="new-created-access-token"
                    value="${ifDefined(this.newCreatedToken.accessToken)}"
                    readonly
                  >
                  </vaadin-text-field>
                  <vaadin-button
                    theme="icon success"
                    @click="${this.handleCopyToClipBoard}"
                  >
                    <vaadin-icon icon="vaadin:clipboard"></vaadin-icon>
                  </vaadin-button>
                </vaadin-horizontal-layout>
                <b style="font-weight:400;color:#656d76;"
                  >Expires on
                  <b style="font-weight:400;font-style: italic;">
                    ${new Date(
                      this.newCreatedToken.expiresAt as string
                    ).toDateString()}
                  </b>
                </b>
              </vaadin-vertical-layout>
              <vaadin-button
                theme="secondary error small"
                style="cursor:pointer;border:0.5px solid #d6d8db;"
                @click="${() => {
                  this.handleTokenRevoke(this.newCreatedToken.id as string);
                }}"
                >Revoke</vaadin-button
              >
            </vaadin-horizontal-layout>
          </vaadin-vertical-layout>
        `
      : html`
          <vaadin-horizontal-layout
            theme="spacing-s padding"
            style="align-items:center;justify-content:space-between;border-bottom:1px solid #d6d8db;flex-wrap:wrap;"
          >
            <vaadin-vertical-layout>
              <b style="font-weight:400;">${token.tokenName}</b>
              <b style="font-weight:400;">${token.accessToken}</b>
              <b style="font-weight:400;color:#656d76;"
                >Expires on
                <b style="font-weight:400;font-style: italic;">
                  ${new Date(token.expiresAt as string).toDateString()}
                </b>
              </b>
            </vaadin-vertical-layout>
            <vaadin-button
              theme="secondary error small"
              style="cursor:pointer;border:0.5px solid #d6d8db;"
              @click="${() => {
                this.handleTokenRevoke(token.id as string);
              }}"
              >Revoke</vaadin-button
            >
          </vaadin-horizontal-layout>
        `;

  render() {
    return html`
      <vaadin-vertical-layout class="token-layout" theme="padding">
        <vaadin-horizontal-layout
          class="token-layout-subhead"
          style="justify-content:space-between;align-items:center;width:100%;flex-wrap: wrap;margin:10px 0;border-bottom:1px solid #d6d8db;padding-bottom:10px;"
        >
          <h2
            style="margin:0;font-weight: 400;font-size: var(--lumo-font-size-xl);"
          >
            Your Access Tokens
          </h2>

          <vaadin-button
            @click=${this.handleGenerateToken}
            style="cursor:pointer;border:0.5px solid #d6d8db;background:#1F1F1F;color:white;"
            >Generate new token</vaadin-button
          >
        </vaadin-horizontal-layout>
        ${this.tokenList.length > 0
          ? html`
              <vaadin-virtual-list
                style="overflow:hidden;border:1px solid #d6d8db;border-radius:5px;--vaadin-virtual-list-item-padding: 0;
                  height: calc(var(--vaadin-virtual-list-item-height) * var(--vaadin-virtual-list-size));"
                .items="${this.tokenList}"
                ${virtualListRenderer(this.tokenCardRenderer, {})}
              >
              </vaadin-virtual-list>
            `
          : null}
        ${this.tokenList.length == 0 &&
        Object.keys(this.newCreatedToken).length == 0
          ? html`
              <h2
                style="margin:0;font-weight: 300;font-size: var(--lumo-font-size-s);"
              >
                Create a new token today to get access to Fundwave API.
              </h2>
            `
          : null}
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
    "client-dashboard": ClientDashBoard;
  }
}
