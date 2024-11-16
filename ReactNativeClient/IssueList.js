import React, { useState } from 'react';
import { Table, Row } from 'react-native-table-component';

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Button,
  View,
} from 'react-native';

const dateRegex = new RegExp('^\\d\\d\\d\\d-\\d\\d-\\d\\d');

function jsonDateReviver(key, value) {
  if (dateRegex.test(value)) return new Date(value);
  return value;
}

async function graphQLFetch(query, variables = {}) {
  try {
    const response = await fetch('http://10.0.2.2:3000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.text();
    const result = JSON.parse(body, jsonDateReviver);

    if (result.errors) {
      const error = result.errors[0];
      if (error.extensions.code === 'BAD_USER_INPUT') {
        const details = error.extensions.exception.errors.join('\n ');
        alert(`${error.message}:\n ${details}`);
      } else {
        alert(`${error.extensions.code}: ${error.message}`);
      }
    }
    return result.data;
  } catch (e) {
    alert(`Error in sending data to server: ${e.message}`);
  }
}

function IssueFilter() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is a placeholder for the issue filter.</Text>
    </View>
  );
}

function IssueRow(props) {
  const issue = props.issue;
  const rowData = [
    issue.id,
    issue.status,
    issue.owner,
    issue.created.toDateString(),
    issue.effort,
    issue.due ? issue.due.toDateString() : '',
    issue.title,
  ];
  return <Row data={rowData} style={styles.row} textStyle={styles.text} />;
}

function IssueTable(props) {
  const issueRows = props.issues.map((issue) => (
    <IssueRow key={issue.id} issue={issue} />
  ));
  const tableHeader = ['ID', 'Status', 'Owner', 'Created', 'Effort', 'Due Date', 'Title'];

  return (
    <View style={styles.container}>
      <Table>
        <Row
          data={tableHeader}
          style={styles.header}
          textStyle={styles.headerText} // 加粗表头文字
        />
        {issueRows}
      </Table>
    </View>
  );
}

class IssueAdd extends React.Component {
  constructor() {
    super();
    this.state = {
      owner: '',
      title: '',
      effort: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleStateChange = (stateName, value) => {
    this.setState({ [stateName]: value });
  };

  handleSubmit() {
    const issue = {
      owner: this.state.owner,
      title: this.state.title,
      effort: this.state.effort,
      due: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 10),
    };
    this.props.createIssue(issue);
    this.setState({ owner: '', title: '', effort: '' });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Add Issue:</Text>
        <TextInput
          style={styles.input}
          placeholder="Owner"
          value={this.state.owner}
          onChangeText={(text) => this.handleStateChange('owner', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={this.state.title}
          onChangeText={(text) => this.handleStateChange('title', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Effort"
          value={this.state.effort}
          onChangeText={(text) => this.handleStateChange('effort', text)}
        />
        <Button title="Submit" onPress={this.handleSubmit} />
      </View>
    );
  }
}

class BlackList extends React.Component {
  constructor() {
    super();
    this.state = { name: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleStateChange = (stateName, value) => {
    this.setState({ [stateName]: value });
  };

  async handleSubmit() {
    await this.props.addToBlacklist(this.state.name);
    this.setState({ name: '' });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Add to BlackList:</Text>
        <TextInput
          placeholder="Name"
          value={this.state.name}
          onChangeText={(value) => this.handleStateChange('name', value)}
          style={styles.input}
        />
        <Button onPress={this.handleSubmit} title="Add" />
      </View>
    );
  }
}

export default class IssueList extends React.Component {
  constructor() {
    super();
    this.state = { issues: [], selector: 1 };
    this.createIssue = this.createIssue.bind(this);
    this.addToBlacklist = this.addToBlacklist.bind(this);
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    const query = `query {
        issueList {
        id title status owner
        created effort due
        }
    }`;

    const data = await graphQLFetch(query);
    if (data) {
      this.setState({ issues: data.issueList });
    }
  }

  async createIssue(issue) {
    const query = `mutation issueAdd($issue: IssueInputs!) {
        issueAdd(issue: $issue) {
        id
        }
    }`;

    const data = await graphQLFetch(query, { issue });
    if (data) {
      alert('Issue added successfully');
      this.loadData();
    }
  }

  async addToBlacklist(nameInput) {
    const query = `mutation addToBlacklist($nameInput: String!) {
        addToBlacklist(nameInput: $nameInput) 
    }`;

    const data = await graphQLFetch(query, { nameInput });
    if (data) {
      alert(`Successfully added ${nameInput} to blacklist`);
    }
  }

  setSelector = (value) => {
    this.setState({ selector: value });
  };

  render() {
    return (
      <SafeAreaView>
        <View style={styles.navbar}>
          <View style={styles.button}>
            <Text style={styles.buttonText} onPress={() => this.setSelector(1)}>
              Filter
            </Text>
          </View>
          <View style={styles.button}>
            <Text style={styles.buttonText} onPress={() => this.setSelector(2)}>
              Table
            </Text>
          </View>
          <View style={styles.button}>
            <Text style={styles.buttonText} onPress={() => this.setSelector(3)}>
              Add
            </Text>
          </View>
          <View style={styles.button}>
            <Text style={styles.buttonText} onPress={() => this.setSelector(4)}>
              BlackList
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {this.state.selector === 1 && <IssueFilter />}
          {this.state.selector === 2 && <IssueTable issues={this.state.issues} />}
          {this.state.selector === 3 && <IssueAdd createIssue={this.createIssue} />}
          {this.state.selector === 4 && <BlackList addToBlacklist={this.addToBlacklist} />}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  text: {
    textAlign: 'center',
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  header: {
    height: 60,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  headerText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  row: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    marginBottom: 10, 
  },
  input: {
    height: 40,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  content: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
