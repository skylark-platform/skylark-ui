import { PrismLight as ReactSyntaxHighlighter } from "react-syntax-highlighter";
import graphqlHighlight from "react-syntax-highlighter/dist/cjs/languages/prism/graphql";
import jsonHighlight from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import highlightStyles from "react-syntax-highlighter/dist/cjs/styles/prism/one-light";

ReactSyntaxHighlighter.registerLanguage("graphql", graphqlHighlight);
ReactSyntaxHighlighter.registerLanguage("json", jsonHighlight);

interface SyntaxHighlighterProps {
  language: "graphql" | "json";
  value: string;
}

export const SyntaxHighlighter = ({
  language,
  value,
}: SyntaxHighlighterProps) => {
  return (
    <ReactSyntaxHighlighter
      language={language}
      style={highlightStyles}
      showLineNumbers
      customStyle={{
        margin: 0,
        paddingRight: 0,
        paddingLeft: 0,
      }}
    >
      {value}
    </ReactSyntaxHighlighter>
  );
};

export default SyntaxHighlighter;
