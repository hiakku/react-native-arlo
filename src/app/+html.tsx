import React from "react";
import {
  ScrollViewStyleReset,
  useServerDocumentContext,
} from "expo-router/html";
// Static document metadata. No account, tracking or advertising scripts.
export default function Root({ children }: { children: React.ReactNode }) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } =
    useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>Arlo — a little less tangled</title>
        <meta
          name="description"
          content="Find a clear path with Arlo. Play 60 relaxing arrow escape puzzles, a fresh daily challenge, and save your progress. Free in your browser."
        />
        <meta name="theme-color" content="#F3F5ED" />
        <meta property="og:title" content="Arlo — a little less tangled" />
        <meta
          property="og:description"
          content="One clear path changes everything. A free arrow escape puzzle game with 60 levels and a fresh daily flow."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <link rel="icon" href="/favicon.ico" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body,#root{background:#F3F5ED}body{margin:0}*{box-sizing:border-box}",
          }}
        />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
