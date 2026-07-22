# Logos Roadmap

## 1. Roadmap Principle

このRoadmapは、Technical Completenessではなく、Product Riskと不確実性の順に進める。

最初に検証するのは、GitHub・Linear・AIエージェント間でSemantic Identityを維持することが、頻繁かつ高コストな問題を解決するかどうかである。このWorkflowが少ないManual Workと、ほぼゼロのIncorrect Mergeで成立するまで、Systemを汎用化しない。

各Phaseには明示的なExit Criteriaを設定する。現在のExit Criteriaへ寄与しない機能は後回しにする。

## 2. Phase 0 — Problem Validation

### Goal

Semantic Fragmentationが小規模ソフトウェアチームで繰り返し発生する問題かを確認し、最も即効性のあるWorkflowを特定する。

### Scope

GitHubと少なくとも一つのTask Trackerを利用するDeveloper・Technical Lead・Founder・Heavy AI Agent UserへInterviewまたはWorkflow Observationを行う。

確認する内容は次の通りである。

- Requirement・Task・Branch・Pull Request・Decisionを現在どのように接続しているか。
- それらの接続がどの程度失われるか。
- AIコーディングエージェントへContextをどのように渡しているか。
- Context不足によって、どのような誤りや遅延が発生するか。
- Naming Convention・URL・Manual Referenceとして、どのRelationがすでに暗黙的に表現されているか。
- どのSemantic Decisionに人間の判断が必要か。
- 問題解決のためにLocal CLIまたはGitHub Appを導入する意思があるか。

### Deliverables

- 5件から10件の詳細なWorkflow Record
- Semantic Fragmentation Problemの優先順位
- 一つのPrimary Workflow
- そのWorkflowに限定した初期Entity・Relation Vocabulary
- Manual Linking回数とContext Reconstruction TimeのBaseline

### Exit Criteria

複数のユーザーが独立して同じ問題を報告し、Repeated Explanation・Agent Error・Duplicate Work・Lost Decisionなどの測定可能なCostを特定できた場合に進む。

問題が一般的な「情報が整理されていない」という表現に留まる場合は、対象Workflowをさらに絞るか、製品仮説を見直す。

## 3. Phase 1 — Semantic Kernel Prototype

### Goal

完全なOntologyを要求せずに、Identity・Relation・Evidence・Uncertaintyを維持できることを確認する。

### Scope

次を持つLocal Semantic Kernelを実装する。

- Entity Storage
- Component Storage
- Typed Relation
- Evidence Record
- Hypothesis Overlay
- Context Stack
- Minimal Query Interface
- Semantic Change用のAppend-Only Event History

初期Entity Type:

- Project
- WorkItem
- Repository
- Branch
- Commit
- PullRequest

初期Relation:

- belongsTo
- implements
- derivesFrom
- blocks
- dependsOn
- references

### Constraints

- Unknown FieldとMissing Relationを正常な状態として扱う。
- HypothesisをCanonical Factと分離する。
- Entity MergeをReversibleにするか、明示的なEventとして表現する。
- すべてのCanonical RelationにProvenanceを持たせる。
- このPhaseではAI Inferenceを不要とする。

### Deliverables

- Local Database Schema
- Semantic Event Model
- EntityとRelationを作成・検査するCLI Command
- Identity Conflict・Missing Data・Reversible MergeのTest
- 一つのEnd-to-End Workflowを表すExample Project Data

### Exit Criteria

LinearとGitHubに存在する一つのWorkItemを表現し、その履歴を保持し、各Relationの根拠を表示し、Canonical FactとHypothesisを区別できる。

## 4. Phase 2 — GitHub and Linear Ingestion

### Goal

既存の開発Dataから、有用なRead-Only Semantic Viewを作る。

### Scope

次のConnectorを実装する。

- Linear ProjectとIssue
- GitHub Repository・Issue・Branch・Commit・Pull Request

次のEvidenceに基づくDeterministic Resolverを実装する。

- Issue URL
- Issue Number
- Pull Request Description
- Branch Name
- Commit Message
- Repository Relation
- LinearとGitHub間のExplicit Reference

LLM Inferenceを主要なMechanismとして利用しない。

### User Experience

CLIまたはMinimal Local Web UIから、次のQueryへ回答できるようにする。

- このLinear Taskに関係するGitHub上の作業は何か。
- このBranchまたはPull RequestはどのTaskを実装しているか。
- Code ChangeはあるがPull RequestがないWorkItemは何か。
- 既知のWorkItemへ接続できないPull Requestは何か。
- 各接続は、どのEvidenceに基づいているか。

### Deliverables

- GitHub Connector
- Linear Connector
- Deterministic Resolver Engine
- Hypothesis Review View
- Evidence Inspector
- Import・Refresh Command

### Metrics

- Deterministic Evidenceによって接続されたRecordの割合
- False Positive Relation Rate
- Unresolved Object数
- Hypothesis Reviewに必要な時間
- 検出されたIdentity Conflict数

### Exit Criteria

実際のRepositoryに対して有用なCross-Tool Viewを生成しながら、Incorrect Identity Mergeをゼロに近い水準へ維持できる。

## 5. Phase 3 — Write-Time Grounding

### Goal

通常の操作中に意味を取得し、後からのSemantic Reconstructionを減らす。

### Scope

次のLogos-Aware Operationを追加する。

- Linear Taskの作業を開始する。
- Active WorkItemからGit Branchを作成する。
- GitHub Issue Representationを作成する。
- Pull Requestを作成する。
- CommitをActive WorkItemへ接続する。
- Active Contextを変更する。

各Operationは、次のいずれかを使ったGrounding Contractを宣言する。

- `represent`
- `derive`
- `relate`
- `observe`

### Example CLI

```text
logos work start ENG-142
logos branch create feature/cache-policy
logos pr create
logos context show
logos explain <entity-or-relation>
```

最終的なInterfaceは変更できるが、Semantic Effectは明示的かつTestableでなければならない。

### Deliverables

- Grounding Contract Format
- Capability Runtime
- Context Propagation
- GitHub Write Integration
- 必要な範囲のLinear Write Integration
- Git Operation用のLocal HookまたはWrapper
- Logos外で作られたDataのMigration Path

### Metrics

- 自動Groundingされた新規Branch・Pull Requestの割合
- WorkItem完了あたりのManual Link数
- 自動作成されたRelationの誤り率
- Logos専用UIを開かずに完了したOperationの割合

### Exit Criteria

Developerが通常のTask・Branch・Pull Request Workflowを完了するだけで、Logosが必要なSemantic Informationを取得できる。Graph編集を別作業として要求しない。

## 6. Phase 4 — AI Agent Context Delivery

### Goal

LogosをAIコーディングエージェントへ直接有用なものにする。

### Scope

MCP-Compatible Serverまたは同等のAgent InterfaceからSemantic Contextを提供する。

初期Agent Capability:

- Active WorkItemを取得する。
- 関連するRequirementとDecisionを取得する。
- Repository・Branch・Commit・Pull Requestの関連状態を取得する。
- 未解決Hypothesisを確認する。
- Provenanceを説明する。
- Relation ProposalをHypothesisとして記録する。
- 重大なOperation前にHuman Confirmationを要求する。

Agentへ無制限なGraph Dumpを渡さない。Active Entityと実行しようとしているOperationに応じてContextを選択する。

### Deliverables

- Agent Context API
- Context Selection Policy
- Read・Propose・Mutateを分離したPermission Model
- 少なくとも二つのCoding AgentへのIntegration Example
- Agentへ提供したContextを記録するSession Log

### Metrics

- 正しいWorkItemを特定して開始されたAgent Sessionの割合
- Manual Context Promptの削減量
- StaleまたはWrong ContextによるAgent Error数
- Context Payload Size
- User Correction Rate
- Agent Generated HypothesisのAccept Rate

### Exit Criteria

Logosを経由してAgent Sessionを開始することで、Repeated Explanationが減り、少なくとも一種類のContext Errorを防げる。そのため、対象ユーザーがLogos経由の開始を選ぶ。

## 7. Phase 5 — Hypothesis Resolution and Learning

### Goal

Uncertaintyを維持しながら、既存Dataと曖昧なDataを低いReview Costで扱う。

### Scope

次のResolver Layerを追加する。

- Deterministic Rule
- Team Defined Convention
- Temporal・Behavioral Signal
- EmbeddingまたはText Similarity
- 制約されたLLM Inference

ユーザーのDecisionからRuleを学習する仕組みを追加する。例えば、確認済みのBranch Naming ConventionやRepositoryとTaskのMappingをLocal Resolverとして保存する。

### Safety Rules

- AI Outputは、Acceptされるか、より強いEvidenceを得るまでHypothesisのままとする。
- Text SimilarityだけでEntity Mergeを行わない。
- Resolver Confidenceを実際のDecisionに対してCalibrationする。
- EvidenceとResolver Versionを検査できるようにする。
- Rejected Hypothesisを将来のRankingへ反映するが、過去の履歴を黙って書き換えない。

### Deliverables

- Resolver Registry
- Confidence Model
- Team Specific Rule
- Operational Impactで並べたReview Queue
- Confirmation・RejectionからのLearning
- Resolver Evaluation Dataset

### Metrics

- Relation TypeごとのPrecision・Recall
- Confirmation Rate
- Repeated Question Rate
- Hypothesis Review Time
- Incorrect Merge Rate
- 実際に作業を妨げるUnresolved Itemの割合

### Exit Criteria

以前は接続できなかったDataの有意な割合を解決し、同じ判断を繰り返させず、必要なPrecisionを維持できる。

## 8. Phase 6 — Team Pilot

### Goal

Personal Prototypeではなく、Shared Team Systemとして成立することを検証する。

### Scope

Team利用に最低限必要な機能を追加する。

- Shared Project Namespace
- Authentication
- Permission
- Audit History
- Connector Configuration
- Conflict Handling
- Basic Administration
- Data Export・Deletion
- Reliability Monitoring

3人から30人程度の複数チームでPilotを行う。

### Deliverables

- HostedまたはSelf-Host可能なPilot Deployment
- Onboarding Flow
- Team Policy Configuration
- Audit Log
- Operational Dashboard
- Support Playbook
- Before・After Measurementを含むCase Study

### Metrics

- Weekly Active User
- TeamあたりのGrounded WorkItem数
- Agent Context Retrieval数
- Manual Linking Rate
- Time to First Value
- 4週間・8週間後のRetention
- Semantic Errorの件数とSeverity
- Logosがなくなると困るという定性的Evidence

### Exit Criteria

複数のTeamがPilot終了後も利用を継続する。利用継続の理由として、Logosを削除すると既知のWorkflow Problemが再発すると説明できる。

## 9. Phase 7 — Productization

### Goal

検証済みのWorkflowを安定した製品へする。

### Scope

- Production Reliability
- Connector Resilience
- BillingとPlan Boundary
- Secure Token Management
- Backup・Recovery
- Observability
- Import・Export
- API・SDK Documentation
- InstallerまたはDeployment Tooling
- Privacy・Data Retention Control

PricingはGraph Sizeではなく、Active Developer数・Grounded WorkItem数・Connected Repository数・Agent Usageなど、測定可能なProduct Valueに対応させる。

### Deliverables

- Public Beta
- Onboarding Documentation
- Security Documentation
- Operational SLO
- Pricing Experiment
- Product Analytics
- Support・Incident Procedure

### Exit Criteria

Founderの直接支援なしで導入でき、Primary Personaに該当するTeamが継続利用する。

## 10. Phase 8 — Domain Expansion

### Goal

Software Development Workflowが安定し、再現可能になった後にだけ拡張する。

### Candidate Expansions

- SlackまたはDiscord上のDiscussion
- Design ToolとDesign Decision
- Product RequirementとDocumentation
- Release ManagementとIncident Management
- Research Project・Paper・Experiment・Dataset
- Personal Project Context

各Domainは、独自のEntity Type・Relation・Grounding Contract・Validation Metricを定義する。Generic Kernelで表現可能という理由だけで追加しない。

### Exit Criteria

新しいDomainに具体的なUser Workflow・独立したPain・Semantic Identityを維持することによる測定可能なValueが存在する。

## 11. Cross-Phase Technical Work

次の課題は一つのPhaseへ後回しにせず、Roadmap全体を通して改善する。

### 11.1 Identity Safety

- Stable Internal Identifier
- External Identifier Mapping
- Reversible Merge
- Conflict Detection
- Weak EvidenceからのAutomatic Destructive Merge禁止

### 11.2 Provenance

- Canonical Factに付随するEvidence
- Resolver Versioning
- Event History
- Explanation Query
- User・Agent DecisionのRecord

### 11.3 Context Selection

- Bounded Context Window
- Relevance Ranking
- Freshness Check
- Fact・Hypothesis・Derived Summaryの区別
- Operation Specific Context Policy

### 11.4 Privacy and Permissions

- Connector Scoped Access
- Project Boundary
- Least Privilege Token
- External Modelへ送るDataのControl
- Deletion・Export
- Auditability

### 11.5 Evaluation

実際のSemantic DecisionからEvaluation Setを継続的に作る。ResolverとAgent Workflowは、Anecdotal SuccessではなくKnown Outcomeに対して評価する。

## 12. Explicit Deferrals

Core Workflowの検証まで、次を延期する。

- General Ontology Authoring
- Main InterfaceとしてのVisual Graph Editing
- 多数のConnector Support
- Autonomous Cross-Tool Mutation
- LLM JudgmentによるAutomatic Entity Merge
- Enterprise Governance Suite
- Broad Personal Knowledge Management
- Software Development以外のSemantic Modeling
- Marketplace・Plugin Ecosystem
- Immediate Product Needを超えるCustom Query Language

## 13. Initial Build Order

実際の実装順は次の通りである。

1. Local Semantic Kernel
2. GitHub Read Connector
3. Linear Read Connector
4. Deterministic ResolutionとEvidence表示
5. Active Context
6. Branch・Pull RequestのWrite-Time Grounding
7. Agent Context API
8. Hypothesis ReviewとLocal Rule Learning
9. Team SharingとPermission
10. Productization

AI InferenceをDeterministic GroundingとProvenanceの後へ置く。主要なRiskは知能不足ではない。誤ったSemantic Identityを構築し、その理由を確認も修正もできないことである。

## 14. Product-Level Success Condition

Developerがプロジェクト上の対象に対する作業を開始したとき、人間・外部ツール・AIエージェントが、その対象は何か・既存の作業とどう関係するか・なぜそのRelationが正しいと考えられるかを一貫して理解できる状態を作る。

そのために、Developerへ別途Semantic Graphの維持を要求してはならない。
