import * as React from "react";

import { TERMS_OF_USE_SECTIONS } from "../../../imports/terms/TermsOfUse";

/**
 * Der reine Text der Nutzungsbedingungen — wird auf der öffentlichen Seite
 * und im Login-Consent-Gate identisch gerendert.
 */
export function TermsOfUseContent(): JSX.Element {
  return (
    <div className="terms-of-use-content">
      {TERMS_OF_USE_SECTIONS.map((section) => (
        <React.Fragment key={section.title}>
          <h4>{section.title}</h4>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
