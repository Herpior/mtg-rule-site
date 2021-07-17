'use strict';

const e = React.createElement;
// I tried to avoid using a public cors proxy but I couldn't get any free host that that I tried to work as a proxy since they are blocking outside connections to prevent spamming and such...
const ruleUrl = "https://api.allorigins.win/get?url=https://media.wizards.com/2021/downloads/MagicCompRules%2020210419.txt";


class SearchBox extends React.Component {

}

class RuleDisplay extends React.Component {
  render(){
    return e(
      'div',
      {id:"rules"},
      this.props.rules[this.props.currentChapter]
        .filter((rule)=>this.props.filter=="" || rule.includes(this.props.filter))
        .map((rule, index) => e('p', {key: "rules-"+index+"-"+rule}, rule))
    );
  }
}
class Chapter extends React.Component {
  render(){
    return e(
      'li',
      {id: this.props.chapter},
      e(
        'button',
        {onClick: this.props.onClick},
        this.props.chapter
      )
    );
  }
}

class ChapterCategory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  render(){
    let header = e(
        'li',
        {id:this.props.heading, key:this.props.heading},
        e(
          'button',
          {onClick: ()=>this.setState({open: !this.state.open})},
          this.props.heading
        ))
    if(!this.state.open){
      return header
    }
    else return [header, e("ul", {key:"ul-"+this.props.heading}, this.props.chapters.map(
      (chapter)=>e(Chapter, {
        key: chapter,
        chapter: chapter,
        onClick:()=>this.props.onClick(chapter)
      })))];
  }
}

class TableOfContents extends React.Component {



  render(){
    /*let tocChapters = this.props.tocChapters.map(
      (chapter) => e(Chapter, {
        key: chapter,
        chapter: chapter,
        onClick:()=>this.props.onClick(chapter)
      })
    );*/
    let tocChapters = Object.keys(this.props.tocHeadings).map(
      (header) => e(ChapterCategory, {
        key: header,
        heading: header,
        chapters: this.props.tocHeadings[header],
        onClick: this.props.onClick,
      }));
    let tocExtras = this.props.tocExtras.map((chapter)=>e(Chapter, {
        key: chapter,
        chapter: chapter,
        onClick:()=>this.props.onClick(chapter)
      }));
    return e('ul', {id: "toc-ul"}, tocChapters.concat(tocExtras));
  }
}

class Rulebook extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      rawText: "Not loaded",
      tocChapters: [],
      tocHeadings: {},
      tocNumbers: {},
      tocExtras: [],
      intro: "Not Loaded.",
      rules: {},
      filter: "",
      currentChapter: "",
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
    let intro = lines.splice(0, i);
    // reset index and skip the Contents line
    i = 1;
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
    return {introduction: intro, contents: toc_lines, rules:chapters};
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
      let intro = lines.splice(0, i);
      // reset index and skip the Contents line
      i = 1;
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
      // and while we're here, let's collect the chapter name and number mappings
      // and header relations
      let chapters = {};
      let tocHeadings = {};
      let tocNumbers = {};
      let headingNro = 0;
      let heading = "0";
      for(let j = 0; j<toc_lines.length;j++){
        let ch_start = i;
        // take lines until the title for the next chapter is seen
        while (i<lines.length && lines[i] != toc_lines[(j+1)%toc_lines.length]){ //using mod to avoid iob exception in the credits
          i += 1;
        }
        let ch_end = i;
        let ch_num = toc_lines[j].split('.')[0];
        if(ch_num < 100){
          headingNro = Number(ch_num);
          heading = toc_lines[j]
          tocNumbers[headingNro] = heading;
          tocHeadings[heading] = [];
        } else if (ch_num>=100*headingNro && ch_num<100*(headingNro+1)){
          tocNumbers[Number(ch_num)] = toc_lines[j];
          tocHeadings[heading].push(toc_lines[j]);
        }
        // add them into the object for easy access
        chapters[toc_lines[j]] = lines.splice(ch_start, ch_end-ch_start);
        // reset the i again
        i = ch_start;
      }
      let extras = toc_lines.filter((line)=>!(line.split('.')[0]<1e9));
      return {
        introduction: intro,
        tocChapters: toc_lines,
        tocHeadings: tocHeadings,
        tocNumbers: tocNumbers,
        tocExtras: extras,
        rules:chapters
      };
    }

    //loadRules(ruleUrl); //this doesn't seem to get defined until after the method is run
    fetch(ruleUrl, {mode: 'cors'}).then((response)=>{
      if (response.ok) return response.json();
    }).then(data =>{
      let ruleObj = parseRules(data.contents);
      this.setState({
        loaded: true,
        rawText: data.contents,
        tocChapters: ruleObj.tocChapters,
        tocHeadings: ruleObj.tocHeadings,
        tocNumbers: ruleObj.tocNumbers,
        tocExtras: ruleObj.tocExtras,
        intro: ruleObj.introduction,
        rules: ruleObj.rules,
        filter: this.state.filter,
        currentChapter: ruleObj.tocChapters[0],
      });
    }).catch((err)=>console.log('fetch error', err));
  }

  render() {
    if (!this.state.loaded) {
      return this.state.rawText;
    }

    return e(
      'div',
      { id: "rule_flex" },
      e(TableOfContents, {
        tocChapters: this.state.tocChapters,
        tocHeadings: this.state.tocHeadings,
        tocNumbers: this.state.tocNumbers,
        tocExtras: this.state.tocExtras,
        onClick: (chapter) =>
          this.setState({
            loaded: this.state.loaded,
            rawText: this.state.rawText,
            tocChapters: this.state.tocChapters,
            tocHeadings: this.state.tocHeadings,
            tocNumbers: this.state.tocNumbers,
            tocExtras: this.state.tocExtras,
            intro: this.state.intro,
            rules: this.state.rules,
            filter: this.state.filter,
            currentChapter: chapter,
          })
      }),
      e(RuleDisplay, {
        currentChapter: this.state.currentChapter,
        filter: this.state.filter,
        tocNumbers: this.state.tocNumbers,
        rules: this.state.rules,
      })
    );
  }
}

const domContainer = document.querySelector('#rule_app_container');
ReactDOM.render(e(Rulebook), domContainer);
