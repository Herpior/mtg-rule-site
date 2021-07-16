'use strict';

const e = React.createElement;
// I tried to avoid using a public cors proxy but I couldn't get any free host that that I tried to work as a proxy since they are blocking outside connections to prevent spamming and such...
const ruleUrl = "https://api.allorigins.win/get?url=https://media.wizards.com/2021/downloads/MagicCompRules%2020210419.txt";


class SearchBox extends React.Component {

}

class RuleDisplay extends React.Component {
  render(){
    return e('p', {id: "rules"}, "some text")
  }
}
class Chapter extends React.Component {

}

class ChapterCategory extends React.Component {

}

class TableOfContents extends React.Component {

  render(){
    return e('ul', {id: "toc-ul"})
  }
}

class Rulebook extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      rawText: 'Not loaded.',
    };
  }

/* assuming the rules file has some introduction first,
   then a line with the text "Contents"
   after which numbered chapters starting from 1 are listed.
   the last line of ToC is before the first item in the contents appears for the second time
   I could ignore glossary and credits though
   otoh I could add a glossary highlight thing
*/
  parseRules(rawText) {
    // let's get the lines with text in them
    const lines = rawText.split("\r\n")
                  .map(line => line.trim())
                  .filter(line => line.length>=1);
    // skip the introduction
    let i = 0;
    while(i<lines.length && lines[i] != "Contents"){
      i += 1;
    }
    // also skip the Contents line
    i += 1;
    // go through the items in the toc until the first item is seen again
    let start = i;
    i += 1;
    while(i<lines.length && lines[i] != lines[start]){
      i += 1;
    }
    let end = i;
    // split the toc into their own array
    let toc_lines = lines.splice(start, end-start);
    // js splice edits the original array so move the index back the same amount
    i = start;
    // now let's collect the rules into an object
    let chapters = {}
    for(let j = 0; j<toc_lines.length;j++){
      let ch_start = i;
      // take lines until the title for the next chapter is seen
      while (i<lines.length && lines[i] != toc_lines[(j+1)%toc_lines.length]){ //using mod to avoid iob exception in the credits
        i += 1;
      }
      let ch_end = i;
      // add them into the object for easy access
      chapters[toc_lines[j]] = lines.splice(ch_start, ch_end-ch_start);
      // reset the i again
      i = ch_start;
    }
    return {contents: toc_lines, rules:chapters};
  }

  loadRules(url) {
    fetch(url).then((response)=>{
      if (response.ok) return response.json();
    }).then(data =>{
      console.log(data);
      this.setState({
        loaded: true,
        rawText: data.contents,
      });
    }).catch((err)=>console.log('fetch error', err));
  }

  componentDidMount() {
    let parseRules = (rawText) => {
      // let's get the lines with text in them
      const lines = rawText.split("\r\n")
                    .map(line => line.trim())
                    .filter(line => line.length>=1);
      // skip the introduction
      let i = 0;
      while(i<lines.length && lines[i] != "Contents"){
        i += 1;
      }
      // also skip the Contents line
      i += 1;
      // go through the items in the toc until the first item is seen again
      let start = i;
      i += 1;
      while(i<lines.length && lines[i] != lines[start]){
        i += 1;
      }
      let end = i;
      // split the toc into their own array
      let toc_lines = lines.splice(start, end-start);
      // js splice edits the original array so move the index back the same amount
      i = start;
      // now let's collect the rules into an object
      let chapters = {}
      for(let j = 0; j<toc_lines.length;j++){
        let ch_start = i;
        // take lines until the title for the next chapter is seen
        while (i<lines.length && lines[i] != toc_lines[(j+1)%toc_lines.length]){ //using mod to avoid iob exception in the credits
          i += 1;
        }
        let ch_end = i;
        // add them into the object for easy access
        chapters[toc_lines[j]] = lines.splice(ch_start, ch_end-ch_start);
        // reset the i again
        i = ch_start;
      }
      return {contents: toc_lines, rules:chapters};
    }

    //loadRules(ruleUrl); //this doesn't seem to get defined until after the method is run
    fetch(ruleUrl, {mode: 'cors'}).then((response)=>{
      if (response.ok) return response.json();
    }).then(data =>{
      console.log(data);
      console.log(parseRules(data.contents));
      this.setState({
        loaded: true,
        rawText: data.contents,
      });
    }).catch((err)=>console.log('fetch error', err));
  }

  render() {
    if (!this.state.loaded) {
      return this.state.rawText;
    }

    return e(
      'div',
      { id: "" },
      e(TableOfContents, this.state),
      e(RuleDisplay, this.state)
    );
  }
}

const domContainer = document.querySelector('#rule_app_container');
ReactDOM.render(e(Rulebook), domContainer);
