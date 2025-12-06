import React, { useRef, useEffect } from "react";
import styles from "./Textarea.module.scss";

export default function Textarea(props) {
    const { value, onChange, onInput, rows = 3, style, ...rest } = props;
    const taRef = useRef(null);

    const adjustHeight = () => {
        const el = taRef.current;
        if (!el) return;
        // reset height so scrollHeight is calculated correctly
        el.style.height = "auto";
        // set height to scrollHeight to fit content
        el.style.height = `${el.scrollHeight}px`;
    };

    useEffect(() => {
        adjustHeight();
        // also adjust on window resize to handle layout changes
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [value, rows]);

    const handleInput = (e) => {
        adjustHeight();
        if (typeof onInput === "function") onInput(e);
        if (typeof onChange === "function") onChange(e);
    };

    return (
        <textarea
            ref={taRef}
            rows={rows}
            className={styles.textarea}
            onChange={handleInput}
            onInput={handleInput}
            value={value}
            style={{ overflow: "hidden", ...style }}
            {...rest}
        />
    );
}
