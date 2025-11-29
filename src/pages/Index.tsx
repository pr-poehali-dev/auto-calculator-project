import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
}

const CATEGORIES = {
  income: ['Зарплата', 'Фриланс', 'Инвестиции', 'Подарки', 'Другое'],
  expense: ['Продукты', 'Транспорт', 'Жильё', 'Развлечения', 'Здоровье', 'Образование', 'Другое']
};

const PERIODS = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' }
];

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [period, setPeriod] = useState('month');
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'income' as TransactionType,
    category: ''
  });

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const diff = now.getTime() - t.date.getTime();
      switch (period) {
        case 'day': return diff <= 24 * 60 * 60 * 1000;
        case 'week': return diff <= 7 * 24 * 60 * 60 * 1000;
        case 'month': return diff <= 30 * 24 * 60 * 60 * 1000;
        case 'year': return diff <= 365 * 24 * 60 * 60 * 1000;
        default: return true;
      }
    });
  }, [transactions, period]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const incomeByCategory = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const expenseByCategory = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      income: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
      expense: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))
    };
  }, [filteredTransactions]);

  const chartData = [
    { name: 'Доходы', value: summary.income },
    { name: 'Расходы', value: summary.expense }
  ];

  const COLORS = {
    income: 'hsl(142 76% 36%)',
    expense: 'hsl(0 84% 60%)'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount || !formData.category) {
      toast.error('Заполните все поля');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }

    if (editingTransaction) {
      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id 
          ? { ...editingTransaction, ...formData, amount }
          : t
      ));
      toast.success('Операция обновлена');
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        title: formData.title,
        amount,
        type: formData.type,
        category: formData.category,
        date: new Date()
      };
      setTransactions([newTransaction, ...transactions]);
      toast.success('Операция добавлена');
    }

    setFormData({ title: '', amount: '', type: 'income', category: '' });
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      title: transaction.title,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    toast.success('Операция удалена');
  };

  const resetForm = () => {
    setFormData({ title: '', amount: '', type: 'income', category: '' });
    setEditingTransaction(null);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Финансовый Калькулятор</h1>
            <p className="text-muted-foreground">Управляйте доходами и расходами эффективно</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Icon name="Plus" size={20} />
                Добавить операцию
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Редактировать операцию' : 'Новая операция'}</DialogTitle>
                <DialogDescription>
                  Добавьте информацию о доходе или расходе
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Например: Продукты"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Сумма</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Тип</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: TransactionType) => {
                      setFormData({ ...formData, type: value, category: '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Доход</SelectItem>
                      <SelectItem value="expense">Расход</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Категория</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES[formData.type].map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingTransaction ? 'Обновить' : 'Добавить'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-income/10 to-income/5 border-income/20 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="TrendingUp" size={18} />
                Доходы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-income">
                {summary.income.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-expense/10 to-expense/5 border-expense/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="TrendingDown" size={18} />
                Расходы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-expense">
                {summary.expense.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
              </div>
            </CardContent>
          </Card>

          <Card className={`animate-fade-in ${summary.balance >= 0 ? 'bg-gradient-to-br from-income/10 to-income/5 border-income/20' : 'bg-gradient-to-br from-expense/10 to-expense/5 border-expense/20'}`} style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="Wallet" size={18} />
                Баланс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {summary.balance.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          <Label>Период:</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="BarChart3" size={20} />
                Сравнение доходов и расходов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.income : COLORS.expense} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>Категории</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="expense" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense">Расходы</TabsTrigger>
                  <TabsTrigger value="income">Доходы</TabsTrigger>
                </TabsList>
                <TabsContent value="expense" className="h-[250px]">
                  {categoryData.expense.length > 0 ? (
                    <ChartContainer config={{}} className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData.expense}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill={COLORS.expense}
                            dataKey="value"
                          >
                            {categoryData.expense.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(0 ${84 - index * 10}% ${60 - index * 5}%)`} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Нет данных
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="income" className="h-[250px]">
                  {categoryData.income.length > 0 ? (
                    <ChartContainer config={{}} className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData.income}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill={COLORS.income}
                            dataKey="value"
                          >
                            {categoryData.income.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(142 ${76 - index * 10}% ${36 + index * 5}%)`} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Нет данных
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="History" size={20} />
              История операций
            </CardTitle>
            <CardDescription>
              {filteredTransactions.length} операций за выбранный период
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
                      }`}>
                        <Icon 
                          name={transaction.type === 'income' ? 'ArrowDownToLine' : 'ArrowUpFromLine'} 
                          size={20}
                          className={transaction.type === 'income' ? 'text-income' : 'text-expense'}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{transaction.title}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                          <span>•</span>
                          <span>{new Date(transaction.date).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${
                        transaction.type === 'income' ? 'text-income' : 'text-expense'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {transaction.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Icon name="Pencil" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Нет операций за выбранный период</p>
                <p className="text-sm">Добавьте первую операцию, чтобы начать учёт</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;