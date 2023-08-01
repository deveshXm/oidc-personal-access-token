import { TokensOIDCClient } from "@fundwave/openapi-client/developerPortal/src";
import "@vaadin/button";
import { Router } from "@vaadin/router";

import axios, { AxiosResponse, AxiosError } from "axios";
import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("api-docs")
export class ApiDocs extends LitElement {
  @state()
  docs: any;

  @state()
  private loading: Boolean;

  constructor() {
    super();
    this.docs = "";
    this.loading = false;
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    const docsUrl: string =
      import.meta.env.MODE == "development"
        ? "http://localhost:8000/"
        : "https://apidocs-server-dhlpjgjgfa-uc.a.run.app/";
    try {
      this.loading = true;
      await TokensOIDCClient.getAccessToken();
      const token = sessionStorage.getItem("token");
      await axios
        .get(docsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response: AxiosResponse) => {
          this.docs = response.data;
        })
        .catch((error: AxiosError) => {
          if (error.response?.status === 403)
            Router.go("/error?error=nopermission");
          else if (error.response?.status === 500)
            Router.go("/error?error=servererror");
        });
    } catch (error) {
      console.log(error);
      Router.go("/error");
    } finally {
      this.loading = false;
    }
  }

  protected override render() {
    return html`
      <div id="docs">
        <iframe
          width="100%"
          height="100%"
          style="overflow-x:hidden;border:none"
          srcdoc="${this.docs}"
        ></iframe>
        <iframe
          width="100%"
          height="100%"
          style="overflow-x:hidden;border:none"
          src="https://fundwave.com/guide/developer/Getting+Started"
        ></iframe>
        ${this.loading ? html` <div class="v-loading-indicator"></div> ` : null}
      </div>
    `;
  }

  static styles = css`
    :host {
    }

    #docs {
      overflow-y: hidden;
      overflow-x: hidden;
      height: 100%;
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
    "api-docs": ApiDocs;
  }
}
