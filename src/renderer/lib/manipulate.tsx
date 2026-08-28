import React from "react";

export function nl2br(str: string) {
    return str.split('\n').map((line, index) => (
        <React.Fragment key={index}>
            {line}
            {index < str.split('\n').length - 1 && <br/>}
        </React.Fragment>
    ));
}