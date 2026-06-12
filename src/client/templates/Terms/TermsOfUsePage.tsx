import * as React from "react";

import { TermsOfUseContent } from "./TermsOfUseContent";

/**
 * Öffentliche Seite /nutzungsbedingungen — ohne Login erreichbar, damit sie
 * aus der Registrierung heraus verlinkt werden kann.
 */
export default function TermsOfUsePage(): JSX.Element {
  return (
    <div className="row">
      <div className="col-md-8 offset-md-2">
        <div className="card card-primary">
          <div className="card-body">
            <h1 className="page-header">Nutzungsbedingungen</h1>
          </div>
        </div>
        <div className="card card-primary">
          <div className="card-body">
            <TermsOfUseContent />
          </div>
        </div>
      </div>
    </div>
  );
}
