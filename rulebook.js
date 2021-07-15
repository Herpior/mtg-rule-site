'use strict';

const e = React.createElement;
// I tried to avoid using a public cors proxy but I couldn't get any free host that that I tried to work as a proxy since they are blocking outside connections to prevent spamming and such...
const ruleUrl = "https://api.allorigins.win/get?url=https://media.wizards.com/2021/downloads/MagicCompRules%2020210419.txt";


class SearchBox extends React.Component {

}

class RuleDisplay extends React.Component {

}
class Chapter extends React.Component {

}

class ChapterCategory extends React.Component {

}

class TableOfContents extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      rawText: 'Not loaded.',
    };
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
    //loadRules(ruleUrl); //this doesn't seem to get defined until after the method is run
    fetch(ruleUrl, {mode: 'cors'}).then((response)=>{
      if (response.ok) return response.json();
    }).then(data =>{
      console.log(data);
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
      'button',
      { onClick: () => this.setState({ liked: true }) },
      this.state.rawText
    );
  }
}

const domContainer = document.querySelector('#rule_app_container');
ReactDOM.render(e(TableOfContents), domContainer);
