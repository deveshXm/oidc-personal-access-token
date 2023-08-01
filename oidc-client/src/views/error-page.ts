import "@vaadin/button";

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { Router } from "@vaadin/router";

@customElement("error-page")
export class ErrorPage extends LitElement {
  @property()
  errorMessage: String;

  constructor() {
    super();
    this.errorMessage = "Oops! Something went wrong.";
  }

  connectedCallback(): void {
    super.connectedCallback();
    const urlParams = new URL(window.location.href);
    const error = urlParams.searchParams.get("error");
    if(error == "nopermission") this.errorMessage = "Access Denied. Contact Support"
    if(error == "servererror") this.errorMessage = "Server Error. Contact Support"
  }
  goBack() {
    Router.go("/"); // Navigate back to the previous page
  }

  protected override render() {
    return html`
      <vaadin-vertical-layout
        style="align-items:center;justify-items:center;"
        theme="padding"
      >
        <h1>${this.errorMessage}</h1>
        <vaadin-button theme="error" @click="${this.goBack}"
          >Go Back</vaadin-button
        >
      </vaadin-vertical-layout>
    `;
  }

  static styles = css`
    :host {
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "error-page": ErrorPage;
  }
}
