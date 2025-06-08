# lotr-draft
A Card Draft App for Lord of the Rings: The Card Game

## How to run locally

Terminal 1 (node server):
```
cd card-draft-server && node server.js
```
Alternatively run the server in debug mode using an IDE Run Configuration (select version of node, the server.js file, and project base directory)


Terminal 2 (Vue app):
```
npm run dev
```

## Project

The intent was to spend as little time as possible, building something almost entirely using LLM. This was done over a weekend
spending a total of 6 hours (my personal timebox limit).

## Outcomes
ChatGPT was better at writing code when given architecturally specific prompts. The better the developer knows the desired architecture, 
the more likely the code will be functional. It was best at provided documentation and carrying a "conversation" about
learning new tech stacks. I could ask it how to implement something, for links to the documents, and links to other examples
and it was able to provide these things, overall exceling at being an assistant.

The main frustration was code revisions. Almost every time we had to go back to
revise the code, the LLM would not take into consideration the existing logic and create something wholly new (or worse, 
create new code that depends on something it _assumes_ existed previously but does not). Extreme care needs to be taken 
if you expect the LLM to be able to iterate on an existing codebase in an expansive way.

