# Logos Concept

## 1. 概要

Logosは、ソフトウェア開発プロジェクトのためのSemantic Context Layerである。

目的は、すべての情報を一つのアプリケーションへ集約することではない。異なるツールに保存された情報が、現実には同じ対象を指しているという事実を維持することである。

一つの機能は、要件文書・Linearのタスク・GitHubのIssueやPull Request・Slack上の議論・Repository内のBranch・AIコーディングエージェントの作業Contextとして現れる。これらは独立した記録ではなく、同じプロジェクト上の対象や活動を異なる場所から表現したものである。

Logosは、その対象を識別し、関係を記録し、得られたContextを人間・外部ツール・AIエージェントへ提供する。

## 2. 問題

現代のソフトウェア開発は、多数のツールへ分割されている。各ツールはプロジェクトの一部を保存するが、その背後にある対象の同一性と関係を維持しない。

その結果、次の問題が起きる。

- 同じ機能が、要件・タスク・Branch・Pull Request・議論・Releaseとして別々に存在する。
- どの記録が同じ対象を指しているかを、開発者が頭の中で維持する必要がある。
- AIエージェントへ不完全または矛盾したContextが渡される。
- 設計判断と、その判断が影響した実装が切り離される。
- 既存の作業を発見できず、重複した作業が作られる。
- 引き継ぎのたびに、プロジェクトの履歴を手作業で再構築する必要がある。
- 一般的なツール連携はデータを複製するが、その意味を維持しない。

中心的な問題は、情報が分散していること自体ではない。同一性・関係・根拠がツール間で失われる、Semantic Fragmentationである。

## 3. Product Thesis

Semantic Graphの維持を、独立した手作業にしてはならない。

ユーザーがTaskからBranchを作成する・BranchからPull Requestを開く・AIとの会話を設計判断として保存する、といった操作には、すでに意味が含まれている。

Logosは、作業後にGraphを編集させるのではなく、通常の操作から意味を回収するべきである。

新しく作られるデータには、決定的なWrite-Time Groundingを優先する。既存データには、Evidenceに基づくHypothesisを生成し、不可逆な判断は十分な根拠が集まるまで遅延させる。

## 4. 製品定義

Logosは、次の機能を持つSemantic Context Layerである。

- プロジェクト上の対象へ安定したIdentityを割り当てる。
- 複数の外部ツールに存在する表現を同じEntityへ接続する。
- Entity間の型付きRelationを記録する。
- IdentityやRelationを判断した根拠と来歴を保存する。
- ユーザーとAIエージェントの現在の作業Contextを維持する。
- 必要になった時点で、欠けているRelationを解決する。
- API・Agent Tool・軽量なUIを通してSemantic Contextを提供する。

初期のLogosは、汎用Knowledge Management Application・Project Management Application・Search Engine・GitHubやLinearの代替ではない。

## 5. 対象ユーザー

初期対象は、複数の開発ツールと少なくとも一つのAIコーディングエージェントを利用する、3人から30人程度のソフトウェア開発チームである。

Primary Userは、プロジェクトのContextを頭の中で維持し、他の開発者やAIエージェントへ繰り返し説明しているTechnical Lead・Senior Developer・Founderである。

典型的な環境は次の通りである。

- GitHubでRepository・Issue・Branch・Commit・Pull Requestを管理する。
- LinearなどでProduct TaskやEngineering Taskを管理する。
- 文書やChatで要件と設計判断を管理する。
- Claude Code・Codex・Cursorなどで実装作業を行う。

日常的な利用者はDeveloper・Product Manager・AI Agentである。導入を決める人物はTechnical Lead・CTO・Engineering Productivity担当・Founderになる。

## 6. Core User Need

ユーザーが必要としているのは、情報を整理するための新しい場所ではない。

人間とAIを含むすべての作業者が、次のことを理解できる必要がある。

- 現在、何を対象として作業しているか。
- 各ツール上のどの記録が、その対象を表しているか。
- どの要件や判断が、その対象を制約しているか。
- どの作業が完了しているか。
- 何が未解決なのか。
- なぜ、そのIdentityやRelationが正しいと判断されたのか。

## 7. Core Model

### 7.1 Entity

Entityは、一つの外部レコードではなく、プロジェクト上の対象を表す。

例:

- Project
- Feature
- WorkItem
- Requirement
- Repository
- Branch
- Commit
- PullRequest
- Decision
- Release
- Person

すべての属性やRelationが判明していなくても、Entityは存在できる。

### 7.2 Component

Componentは、Entityの一側面または外部ツール上の表現を保存する。

例:

- GitHubIssue
- LinearIssue
- GitHubPullRequest
- RepositoryMetadata
- TextDescription
- Status
- TemporalMetadata

複数のツールが同じ対象を表している場合、複数のComponentが一つのEntityへ属する。

### 7.3 Relation

Relationは、二つのEntityを明示的な意味で接続する。

例:

- belongsTo
- implements
- derivesFrom
- blocks
- dependsOn
- supersedes
- discusses
- documents
- releasedAs
- authoredBy

Relationには型・必要に応じた方向・Provenanceを持たせる。

### 7.4 Context

Contextは、現在有効な意味上の範囲を表す。

Contextには、次のようなEntityが含まれる。

- 選択中のProject
- 現在のWorkItem
- 開いているRepository
- Active Branch
- 編集中のFile
- 現在の会話で参照されたEntity
- 現在の操作に関係する未解決のHypothesis

Contextは原則として一時的である。同じContext内に存在するだけでは、永続的なRelationを作成しない。

### 7.5 Capability

Capabilityは、Logosまたは統合されたツールが実行する操作である。

各Capabilityは、その操作がIdentityやRelationへ与える影響を定義するGrounding Contractを持つ。

初期の操作分類は次の四つである。

- `represent`: 既存Entityへ新しい外部表現を追加する。
- `derive`: 現在のEntityから新しいEntityを作成し、その関係を記録する。
- `relate`: 既存Entity同士を明示的なRelationで接続する。
- `observe`: Identityが未解決な外部Objectを取り込む。

### 7.6 Evidence

Evidenceは、IdentityやRelationが正しいと判断した理由を保存する。

例:

- 操作時に伝播されたLogos Entity ID
- 明示的なURLやIssue参照
- Branch Naming Convention
- Repositoryとの所属関係
- 外部サービス上の親子関係
- Timestampと操作履歴
- Text Similarity
- AIによる推論
- ユーザーによる明示的な確認

判断後もEvidenceを検査できなければならない。

### 7.7 Hypothesis

Hypothesisは、まだ確定していない意味上の主張である。

例:

- GitHub IssueとLinear Issueが同じWorkItemを表している可能性がある。
- Branchが特定のFeatureを実装している可能性がある。
- Discussionが特定のDecisionを記録している可能性がある。
- 二つのEntityが重複している可能性がある。

HypothesisはCandidate・Confidence・Evidence・Resolver・作成時刻を持つ。AIが生成したという理由だけではCanonical Factにならない。

## 8. Grounding Strategy

### 8.1 Write-Time Grounding

Logosを認識した操作を通してObjectが作成される場合、その作成時にSemantic Informationを伝播する。

例:

- Logos上のWorkItemからGitHub Issueを作成した場合、同じEntityへGitHubIssue Componentを追加する。
- WorkItemからBranchを作成した場合、Branch Entityと`implements` Relationを作成する。
- 既知のBranchからPull Requestを開いた場合、PullRequest EntityをBranchおよびWorkItemへ接続する。
- 会話をDecisionとして保存した場合、Decision Entityを作成し、FeatureまたはWorkItemへ接続する。

Write-Time Groundingは決定的であり、後から意味を再構築する必要がないため、最優先の経路とする。

### 8.2 Read-Time Resolution

Logosを介さず作成された既存データには、信頼できるIdentityが存在しない。

この場合、ResolverがEvidenceに基づいてHypothesisを生成する。名前や文章が似ているだけでは、Entityを自動Mergeしない。

Resolverの優先順位は、原則として次の順とする。

1. 伝播されたLogos Entity ID
2. 明示的な外部参照またはURL
3. 外部システム自身が持つ構造
4. 決定的なローカル規則
5. 時間的・操作的Evidence
6. Textual Evidence
7. AI Inference

### 8.3 Lazy Resolution

Logosは、完全なSemantic Graphを事前に構築しない。

Unknown・Unresolved・Conflictingは正常な状態である。Queryや操作が必要とした時点で解決を行う。

例えば、Featureに関係するすべての作業を要求された場合は、関係するResolverを実行できる。一方、二つのEntityをMergeする場合は、表示上の候補を出す場合より強いEvidenceを要求する。

### 8.4 Human Confirmation

人間への確認は、曖昧さが重大な操作へ影響する場合だけ行う。

確認が必要な操作は次の通りである。

- Entity IdentityのMerge
- 破壊的な変更の同期
- 外部システムの更新
- 曖昧な対象へAIエージェントが変更を加える場合
- プロジェクト履歴を変えるConflict Resolution

確認はGraph編集として提示せず、「このGitHub IssueとLinear Issueは同じ作業か」のような一つの具体的判断として提示する。

## 9. User Experience Principles

### 9.1 Work First, Semantics Second

ユーザーは通常の作業を行う。Logosは、その操作からSemantic Informationを回収する。

### 9.2 No Mandatory Graph Maintenance

Graphは内部モデルおよび検査用の表示であり、主要な編集画面ではない。

### 9.3 Provenance Is Visible

重要なIdentityとRelationは、すべて説明可能でなければならない。判断が明示的参照・操作・規則・AI推論のどれに由来するかを表示する。

### 9.4 Uncertainty Is Preserved

すべての可能性をFactへ変換せず、Uncertaintyを直接表現する。

### 9.5 Reversible Before Irreversible

低リスクな表示にはHypothesisを利用できる。Identity Mergeや破壊的同期には、より強いEvidenceを要求する。

### 9.6 Context Is Delivered, Not Searched For

ユーザーまたはAIエージェントがEntityに対する作業を開始した時点で、関係する要件・Decision・Code Change・Discussion・未解決事項を提供する。複数ツールを手作業で検索させない。

## 10. Initial Product Surface

最初の製品は、GitHub・Linear・AIコーディングエージェントへ集中する。

初期のUser-Facing Surfaceは次の通りである。

- Grounded Workを作成・検査するCLI
- 現在のSemantic Contextを取得するMCP互換InterfaceまたはAgent Protocol
- GitHub Integration
- Linear Integration
- HypothesisとProvenanceを確認する軽量なReview UI
- Entity・Relation・Context・EvidenceをQueryするAPI

Standalone Workspace・Graph Editor・汎用Note Applicationは、初期版に必要ない。

## 11. Initial Workflows

### 11.1 Taskの作業を開始する

DeveloperがLinear Taskを選択する。LogosはWorkItem Entityを解決または作成し、関連するRequirementとDecisionを読み込み、Active Contextとして設定する。

### 11.2 Branchを作成する

DeveloperがLogosを認識したCommandからBranchを作成する。LogosはBranch Entityと、Active WorkItemに対する`implements` Relationを作成する。

### 11.3 AIエージェントで作業する

AIエージェントがCurrent Contextを要求する。LogosはActive WorkItem・Requirement・Decision・Repository情報・既存実装・未解決Hypothesisを返す。

### 11.4 Pull Requestを作成する

Pull Requestの作成時に、LogosはBranchおよびWorkItemとのRelationを記録する。必要に応じて、関連するDecisionとSemantic SummaryをPull Requestへ追加する。

### 11.5 Project Stateを確認する

ユーザーがFeatureの未解決事項を要求する。LogosはLinearとGitHubを横断して、既知のRelationと関連Hypothesisを走査し、Evidence付きの結果を返す。

## 12. Non-Goals

初期のLogosは、次のことを目的としない。

- すべてのDomainをModelingする。
- GitHub・Linear・Documentation Toolを置き換える。
- 重複するすべてのRecordを自動Mergeする。
- 任意のDataから完全なOntologyを推論する。
- 汎用Personal Knowledge Management Systemになる。
- Universal Graph Editorを提供する。
- すべてのFieldを双方向同期する。
- AIが生成した主張をProvenanceなしでCanonicalにする。
- Core Workflowの検証前にEnterprise全社導入へ対応する。

## 13. Differentiation

一般的なIntegrationはApplication間でFieldを移動する。Search ProductはRecordを検索する。Knowledge GraphはRelationを表現できるが、多くの場合は明示的な構築作業を要求する。Agent Memoryは過去のContextを保存するが、安定したProject IdentityやProvenanceを失うことがある。

Logosは、次を組み合わせる。

- ツールをまたぐStable Identity
- 操作から生成されるSemantic Grounding
- 明示的なUncertaintyとEvidence
- Lazy Resolution
- AIエージェントへのContext Delivery
- 外部Recordと、それらが表現する現実の対象との分離

## 14. Success Metrics

製品はGraph Sizeではなく、実際の作業結果で評価する。

Primary Metricsは次の通りである。

- 新しく作成されたObjectのうち、Manual LinkingなしでGroundingされた割合
- WorkItem完了あたりのManual Semantic Decision数
- 誤ったEntity Mergeの発生率
- 正しいProject Contextで開始されたAgent Sessionの割合
- WorkItemの履歴を再構築するために必要な時間
- 実装前に検出されたDuplicate Work数
- 通常のWorkflowで必要となったUser Confirmation数

最重要のSafety Metricは、Incorrect Identity Merge Rateである。Relationが不足することは許容できるが、異なる対象を誤って同一化してはならない。

## 15. Long-Term Direction

Software Development Domainで有効性が検証された後、Design・Research・Operationなどへ拡張できる。

長期的には、人間・Application・AIエージェントが共有するSemantic Substrateになり得る。しかし、すべてのKnowledgeを抽象的にModelingすることから始めてはならない。検証済みのDomain Workflowから段階的に拡張する。

Logosの中心原則は、次の一文に集約される。

> 意味を追加作業として要求せず、作業そのものから回収する。
