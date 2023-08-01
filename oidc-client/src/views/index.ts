import "@vaadin/app-layout";
import "@vaadin/app-layout/vaadin-drawer-toggle";
import "@vaadin/tabs";
import "@vaadin/button";
import "./client-dashboard.ts";
import "./generate-token.ts";
import "./error-page.ts";
import "./api-docs.ts";

import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { HttpDetails as TokensHttpDetails } from "@fundwave/openapi-client/developerPortal/src/http-details";
import { TokensOIDCClient } from "@fundwave/openapi-client/developerPortal/src/index";
import { Router } from "@vaadin/router";
import routes from "../../routes.json";

@customElement("index-layout")
export class IndexLayout extends LitElement {
  @property()
  router?: Router;

  @state()
  authenticating: Boolean;

  @state()
  selectedRoute: Number;

  constructor() {
    super();
    this.authenticating = true;
    this.selectedRoute = 0;
    const realm = localStorage.getItem("realm") ?? "master";
    TokensOIDCClient.setBaseUrl(
      import.meta.env.MODE == "development"
        ? `http://localhost:3000/${realm}`
        : `https://apitoken-service-dev-fmop7ymbka-uc.a.run.app/${realm}`
    );
    TokensHttpDetails.setBaseUrl(
      import.meta.env.MODE == "development"
        ? `http://localhost:3000`
        : "https://apitoken-service-dev-fmop7ymbka-uc.a.run.app"
    );
  }

  firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.router = new Router(this.shadowRoot?.querySelector("#outlet"));
    this.router.setRoutes(routes);
    this.selectedRoute =
      routes.find((route) => route.path === window.location.pathname)?.drawer ??
      0;
  }

  getLoginRedirectUrl(): string {
    let loginUrl = window.location.origin + "/login";
    return loginUrl;
  }

  async handleLogout(event: any) {
    try {
      event.target.disabled = true;
      const idToken = sessionStorage.getItem("token");
      const realm: string = localStorage.getItem("realm") ?? "master";
      const serverUrl: string =
        import.meta.env.MODE == "development"
          ? "http://localhost:3000"
          : "https://apitoken-service-dev-fmop7ymbka-uc.a.run.app";
      const logoutUrl =
        `${serverUrl}/${realm}/logout` +
        "?redirectUri=" +
        this.getLoginRedirectUrl() +
        "&idToken=" +
        idToken;
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("realm");
      sessionStorage.removeItem("token");
      window.location.replace(logoutUrl);
    } catch (error) {
      event.target.disabled = false;
      console.log(error);
    }
  }
  handleGoToRoute(route: string) {
    Router.go(route);
  }
  render() {
    return html`
      <vaadin-app-layout
        style="display:${this.authenticating ? "none" : "block"}"
      >
        <vaadin-drawer-toggle slot="navbar"></vaadin-drawer-toggle>
        <vaadin-horizontal-layout
          slot="navbar"
          style=";width:100%;justify-content:space-between;align-items:center;padding-right:2rem;"
        >
          <h1
            style="word-wrap: break-word;white-space: nowrap;font-size: var(--lumo-font-size-xl);margin: var(--lumo-space-m);font-weight: 400;cursor:pointer;"
            @click="${() => {
              this.handleGoToRoute("/");
            }}"
          >
            Developer Portal
          </h1>
          <vaadin-button
            @click="${this.handleLogout}"
            theme="primary"
            style="cursor:pointer;color:white;background-color:black"
            >Sign Out</vaadin-button
          >
        </vaadin-horizontal-layout>
        <vaadin-tabs
          slot="drawer"
          selected="${this.selectedRoute}"
          orientation="vertical"
        >
          ${routes.map((route) => {
            if (route.drawer !== undefined) {
              return html`
                <vaadin-tab
                  style="cursor:pointer;"
                  @click="${() => {
                    this.handleGoToRoute(route.path);
                  }}"
                  tab-index="${route.drawer}"
                >
                  <vaadin-horizontal-layout
                    style=" align-items:center;width:100%;"
                    theme="spacing padding"
                  >
                    <vaadin-icon icon="${route.icon}"></vaadin-icon>
                    <span>${route.pathname}</span>
                  </vaadin-horizontal-layout>
                </vaadin-tab>
              `;
            }
          })}
        </vaadin-tabs>
        <div id="outlet"></div>
      </vaadin-app-layout>
    `;
  }

  static styles = css`
    vaadin-app-layout::part(navbar) {
      border-bottom: 1px solid #d6d8db;
    }

    vaadin-app-layout {
      height: 100%;
      width: 100%;
    }

    #outlet {
      height: 100%;
      width: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "index-layout": IndexLayout;
  }
}
